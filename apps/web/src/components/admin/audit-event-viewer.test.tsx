import {fireEvent, render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuditEventViewer} from '@/components/admin/audit-event-viewer';
import {chooseOption, getSelect, querySelect} from '@/test/select';
import {resetPendingListUrlPush} from '@/lib/admin/use-list-url-state';
import {ApiError} from '@/lib/api/http';
import type {PagedResult} from '@/types/admin/admin-list';
import type {AuditEvent} from '@/types/admin/audit-event';

const {useAuditEvents, push, searchParams} = vi.hoisted(() => ({
	useAuditEvents: vi.fn(),
	push: vi.fn(),
	searchParams: {current: new URLSearchParams()},
}));

vi.mock('@/lib/hooks/use-admin', () => ({
	useAuditEvents,
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
	usePathname: () => '/dashboard/admin',
	useSearchParams: () => searchParams.current,
}));

const sampleEvent: AuditEvent = {
	id: 'demo-audit-001',
	practiceId: 'demo-practice-001',
	actorUserId: 'user_mock_practice_admin',
	action: 'auth.login.succeeded',
	resourceType: 'session',
	resourceId: null,
	correlationId: 'demo-correlation-001',
	createdAt: '2026-09-26T14:00:00.000Z',
};

function pageOf(count: number, total = 312): PagedResult<AuditEvent> {
	return {
		items: Array.from({length: count}, (_, index) => ({...sampleEvent, id: `demo-audit-${index}`})),
		total,
		hasMore: true,
		nextPage: 2,
	};
}

function mockEvents(overrides: Record<string, unknown> = {}) {
	useAuditEvents.mockReturnValue({
		data: pageOf(1),
		isPending: false,
		isError: false,
		isPlaceholderData: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('AuditEventViewer', () => {
	beforeEach(() => {
		resetPendingListUrlPush();
		useAuditEvents.mockReset();
		push.mockClear();
		searchParams.current = new URLSearchParams();
	});

	it('renders synthetic audit metadata in a labelled table without emails', () => {
		mockEvents();
		render(<AuditEventViewer />);

		const table = screen.getByRole('table', {name: 'Audit events'});
		expect(table).toHaveTextContent('auth.login.succeeded');
		expect(table).toHaveTextContent('session');
		expect(table).toHaveTextContent('user_mock_practice_admin');
		expect(table).not.toHaveTextContent('@example.test');
		expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
			'Action',
			'Resource',
			'Actor',
			'Time',
		]);
	});

	it('keeps the table layout classes valid so cells form a grid from md up', () => {
		mockEvents();
		render(<AuditEventViewer />);

		for (const cell of within(screen.getByRole('table')).getAllByRole('cell')) {
			expect(cell).toHaveClass('block', 'text-sm', 'md:table-cell');
		}
	});

	it('requests exactly one page with no filters on first load', () => {
		mockEvents();
		render(<AuditEventViewer />);

		expect(useAuditEvents).toHaveBeenCalledWith({
			page: 1,
			action: undefined,
			resourceType: undefined,
			from: undefined,
			to: undefined,
		});
	});

	it('shows the range, total and newest-first note, and bounds rows to the page', () => {
		searchParams.current = new URLSearchParams('auditPage=2');
		mockEvents({data: pageOf(25)});
		render(<AuditEventViewer />);

		expect(screen.getByText(/Showing 26–50 of 312 events · newest first/)).toBeInTheDocument();
		expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(26);
		expect(useAuditEvents).toHaveBeenCalledWith(expect.objectContaining({page: 2}));
	});

	it('reads page and filters from the URL', () => {
		searchParams.current = new URLSearchParams(
			'auditPage=3&auditAction=role_changed&auditResourceType=user&auditFrom=2026-10-01&auditTo=2026-10-05&securityPage=9',
		);
		mockEvents();
		render(<AuditEventViewer />);

		expect(useAuditEvents).toHaveBeenCalledWith({
			page: 3,
			action: 'role_changed',
			resourceType: 'user',
			from: '2026-10-01',
			to: '2026-10-05',
		});
		expect(getSelect('Action')).toHaveTextContent('role_changed');
	});

	it('goes to the next, previous and numbered page while keeping filters', async () => {
		searchParams.current = new URLSearchParams('auditPage=2&auditAction=role_changed&usersPage=4');
		mockEvents({data: pageOf(25)});
		const user = userEvent.setup();
		render(<AuditEventViewer />);

		// Each click starts from the same mocked URL, as if the router had caught up in between.
		const applyPushedUrl = resetPendingListUrlPush;
		await user.click(screen.getByRole('button', {name: 'Next page'}));
		expect(push).toHaveBeenLastCalledWith(
			'/dashboard/admin?auditPage=3&auditAction=role_changed&usersPage=4',
			{scroll: false},
		);
		applyPushedUrl();
		await user.click(screen.getByRole('button', {name: 'Previous page'}));
		expect(push).toHaveBeenLastCalledWith(
			'/dashboard/admin?auditAction=role_changed&usersPage=4',
			{scroll: false},
		);
		applyPushedUrl();
		await user.click(screen.getByRole('button', {name: 'Page 13'}));
		expect(push).toHaveBeenLastCalledWith(
			'/dashboard/admin?auditPage=13&auditAction=role_changed&usersPage=4',
			{scroll: false},
		);
	});

	it('resets to page 1 when a filter changes', async () => {
		searchParams.current = new URLSearchParams('auditPage=5');
		mockEvents({data: pageOf(25)});
		const user = userEvent.setup();
		render(<AuditEventViewer />);

		await chooseOption(user, 'Action', 'access.denied');
		expect(push).toHaveBeenLastCalledWith('/dashboard/admin?auditAction=access.denied', {
			scroll: false,
		});
	});

	it('applies a valid date range and blocks a reversed one with an inline alert', () => {
		mockEvents();
		render(<AuditEventViewer />);

		fireEvent.change(screen.getByLabelText('From'), {target: {value: '10/05/2026'}});
		expect(screen.getByLabelText('From')).toHaveValue('10/05/2026');
		expect(push).toHaveBeenLastCalledWith('/dashboard/admin?auditFrom=2026-10-05', {scroll: false});

		push.mockClear();
		fireEvent.change(screen.getByLabelText('To'), {target: {value: '10/01/2026'}});
		expect(screen.getByRole('alert')).toHaveTextContent(
			'The end date must be on or after the start date.',
		);
		expect(screen.getByLabelText('To')).toHaveAttribute('aria-invalid', 'true');
		expect(push).not.toHaveBeenCalled();
	});

	it('clears every filter and returns to page 1', async () => {
		searchParams.current = new URLSearchParams('auditPage=3&auditAction=role_changed&usersQ=nurse');
		mockEvents();
		const user = userEvent.setup();
		render(<AuditEventViewer />);

		await user.click(screen.getByRole('button', {name: 'Clear filters'}));
		expect(push).toHaveBeenLastCalledWith('/dashboard/admin?usersQ=nurse', {scroll: false});
	});

	it('keeps the previous page dimmed and the controls disabled while the next page loads', () => {
		searchParams.current = new URLSearchParams('auditPage=3');
		mockEvents({data: pageOf(25), isPlaceholderData: true});
		render(<AuditEventViewer />);

		expect(screen.getByRole('table').parentElement).toHaveAttribute('aria-busy', 'true');
		expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
		expect(screen.getByRole('button', {name: 'Previous page'})).toBeDisabled();
	});

	it('moves focus to the heading after the page changes', () => {
		mockEvents({data: pageOf(25)});
		const {rerender} = render(<AuditEventViewer />);
		expect(screen.getByRole('heading', {name: 'Audit events'})).not.toHaveFocus();

		searchParams.current = new URLSearchParams('auditPage=2');
		rerender(<AuditEventViewer />);
		expect(screen.getByRole('heading', {name: 'Audit events'})).toHaveFocus();
	});

	it('shows a loading state and disables filters until the first response', () => {
		mockEvents({data: undefined, isPending: true});
		render(<AuditEventViewer />);

		expect(screen.getByText('Loading audit events')).toBeInTheDocument();
		expect(screen.queryByRole('table')).not.toBeInTheDocument();
		expect(getSelect('Action')).toBeDisabled();
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		mockEvents({data: undefined, isError: true, refetch});
		const user = userEvent.setup();
		render(<AuditEventViewer />);

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load audit events.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(refetch).toHaveBeenCalledOnce();
	});

	it('surfaces a 403 ApiError message', () => {
		mockEvents({
			data: undefined,
			isError: true,
			error: new ApiError('You do not have permission to perform this action', 403, {
				code: 'FORBIDDEN',
			}),
		});
		render(<AuditEventViewer />);

		expect(screen.getByRole('alert')).toHaveTextContent(
			'You do not have permission to perform this action',
		);
	});

	it('shows an empty message and hides filters when there is no data at all', () => {
		mockEvents({data: {items: [], total: 0, hasMore: false}});
		render(<AuditEventViewer />);

		expect(screen.getByText('No audit events to display.')).toBeInTheDocument();
		expect(querySelect('Action')).toBeNull();
		expect(screen.queryByRole('navigation', {name: 'Audit events pagination'})).not.toBeInTheDocument();
	});

	it('shows filtered-empty copy and keeps the filters', () => {
		searchParams.current = new URLSearchParams('auditAction=role_changed');
		mockEvents({data: {items: [], total: 0, hasMore: false}});
		render(<AuditEventViewer />);

		expect(screen.getByText('No events match these filters.')).toBeInTheDocument();
		expect(getSelect('Action')).toHaveTextContent('role_changed');
		expect(screen.getByRole('button', {name: 'Clear filters'})).toBeInTheDocument();
	});

	it('offers a way back when the page is past the end', async () => {
		searchParams.current = new URLSearchParams('auditPage=14&auditAction=role_changed');
		mockEvents({data: {items: [], total: 312, hasMore: false}});
		const user = userEvent.setup();
		render(<AuditEventViewer />);

		expect(screen.getByRole('status')).toHaveTextContent(
			'Page 14 is past the end of the results (312 events).',
		);
		await user.click(screen.getByRole('button', {name: 'Back to first page'}));
		expect(push).toHaveBeenLastCalledWith('/dashboard/admin?auditAction=role_changed', {
			scroll: false,
		});
	});
});
