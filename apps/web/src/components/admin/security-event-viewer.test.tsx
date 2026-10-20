import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SecurityEventViewer} from '@/components/admin/security-event-viewer';
import {ApiError} from '@/lib/api/http';
import type {PagedResult} from '@/types/admin/admin-list';
import type {AuditEvent} from '@/types/admin/audit-event';

const {useSecurityEvents, push, searchParams} = vi.hoisted(() => ({
	useSecurityEvents: vi.fn(),
	push: vi.fn(),
	searchParams: {current: new URLSearchParams()},
}));

vi.mock('@/lib/hooks/use-admin', () => ({
	useSecurityEvents,
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
	usePathname: () => '/dashboard/admin',
	useSearchParams: () => searchParams.current,
}));

const sampleEvent: AuditEvent = {
	id: 'demo-security-001',
	practiceId: 'demo-practice-001',
	actorUserId: 'user_mock_practice_admin',
	action: 'auth.login.succeeded',
	resourceType: 'session',
	resourceId: null,
	correlationId: 'demo-security-correlation-001',
	createdAt: '2026-10-06T08:00:00.000Z',
};

function pageOf(count: number, total = 312): PagedResult<AuditEvent> {
	return {
		items: Array.from({length: count}, (_, index) => ({...sampleEvent, id: `demo-security-${index}`})),
		total,
		hasMore: true,
		nextPage: 2,
	};
}

function mockEvents(overrides: Record<string, unknown> = {}) {
	useSecurityEvents.mockReturnValue({
		data: pageOf(1),
		isPending: false,
		isError: false,
		isPlaceholderData: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('SecurityEventViewer', () => {
	beforeEach(() => {
		useSecurityEvents.mockReset();
		push.mockClear();
		searchParams.current = new URLSearchParams();
	});

	it('renders synthetic security metadata without emails', () => {
		mockEvents();
		render(<SecurityEventViewer />);

		expect(screen.getByRole('heading', {level: 2, name: 'Security events'})).toBeInTheDocument();
		expect(
			screen.getByText(
				'Tenant-scoped authentication and session events. Synthetic ids only. Not a SIEM or HIPAA audit export.',
			),
		).toBeInTheDocument();
		const table = screen.getByRole('table', {name: 'Security events'});
		expect(table).toHaveTextContent('auth.login.succeeded');
		expect(table).toHaveTextContent('user_mock_practice_admin');
		expect(table).not.toHaveTextContent('@example.test');
	});

	it('requests one page and offers only auth actions as filters', () => {
		mockEvents();
		render(<SecurityEventViewer />);

		expect(useSecurityEvents).toHaveBeenCalledWith(expect.objectContaining({page: 1}));
		const options = within(screen.getByRole('combobox', {name: 'Action'}))
			.getAllByRole('option')
			.map((option) => option.getAttribute('value'));
		expect(options.filter(Boolean).every((value) => value?.startsWith('auth.'))).toBe(true);
	});

	it('uses its own URL keys so the other lists keep their position', async () => {
		searchParams.current = new URLSearchParams('securityPage=2&auditPage=5');
		mockEvents({data: pageOf(25)});
		const user = userEvent.setup();
		render(<SecurityEventViewer />);

		expect(screen.getByText(/Showing 26–50 of 312 events/)).toBeInTheDocument();
		await user.click(screen.getByRole('button', {name: 'Next page'}));
		expect(push).toHaveBeenLastCalledWith('/dashboard/admin?securityPage=3&auditPage=5', {
			scroll: false,
		});
	});

	it('shows a loading state', () => {
		mockEvents({data: undefined, isPending: true});
		render(<SecurityEventViewer />);

		expect(screen.getByText('Loading security events')).toBeInTheDocument();
		expect(screen.queryByRole('table')).not.toBeInTheDocument();
	});

	it('shows an error alert and retries from the keyboard', async () => {
		const refetch = vi.fn();
		mockEvents({data: undefined, isError: true, refetch});
		const user = userEvent.setup();
		render(<SecurityEventViewer />);

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load security events.');
		const retry = screen.getByRole('button', {name: 'Retry'});
		retry.focus();
		await user.keyboard('{Enter}');
		expect(refetch).toHaveBeenCalledOnce();
	});

	it('surfaces a 403 ApiError message in an alert', () => {
		mockEvents({
			data: undefined,
			isError: true,
			error: new ApiError('You do not have permission to perform this action', 403, {
				code: 'FORBIDDEN',
			}),
		});
		render(<SecurityEventViewer />);

		expect(screen.getByRole('alert')).toHaveTextContent(
			'You do not have permission to perform this action',
		);
		expect(screen.queryByRole('table')).not.toBeInTheDocument();
	});

	it('shows an empty message', () => {
		mockEvents({data: {items: [], total: 0, hasMore: false}});
		render(<SecurityEventViewer />);

		expect(screen.getByText('No security events to display.')).toBeInTheDocument();
		expect(screen.queryByRole('table')).not.toBeInTheDocument();
	});
});
