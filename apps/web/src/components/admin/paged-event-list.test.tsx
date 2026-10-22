import {render, screen, within} from '@testing-library/react';
import {PagedEventList} from '@/components/admin/paged-event-list';
import {resetPendingListUrlPush} from '@/lib/admin/use-list-url-state';
import type {AuditEvent} from '@/types/admin/audit-event';

const {push, searchParams} = vi.hoisted(() => ({
	push: vi.fn(),
	searchParams: {current: new URLSearchParams()},
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

function renderList() {
	const items = [sampleEvent, {...sampleEvent, id: 'demo-audit-002'}];
	render(
		<PagedEventList
			prefix="audit"
			title="Audit events"
			description="Synthetic events."
			loadingLabel="Loading audit events"
			emptyMessage="No events."
			errorMessage="Could not load events."
			actionOptions={['auth.login.succeeded']}
			resourceTypeOptions={['session']}
			useEvents={() => ({
				data: {items, total: items.length, hasMore: false},
				isPending: false,
				isError: false,
				refetch: vi.fn(),
			})}
		/>,
	);
	return screen.getByRole('table', {name: 'Audit events'});
}

describe('PagedEventList time column', () => {
	beforeEach(() => {
		resetPendingListUrlPush();
		push.mockClear();
		searchParams.current = new URLSearchParams();
	});

	it('sizes the Time header to its content and keeps it on one line', () => {
		const table = renderList();

		const header = within(table).getByRole('columnheader', {name: 'Time'});
		expect(header).toHaveClass('whitespace-nowrap', 'md:w-px');
		expect(header).not.toHaveClass('md:w-48');
	});

	it('keeps every Time cell on one line from md up and content-sized', () => {
		const table = renderList();

		const rows = within(table).getAllByRole('row').slice(1);
		expect(rows).toHaveLength(2);
		for (const row of rows) {
			const timeCell = within(row).getAllByRole('cell')[3];
			expect(timeCell).toHaveClass('md:w-px', 'md:whitespace-nowrap');
			expect(timeCell).not.toHaveClass('md:w-48', 'whitespace-nowrap');
		}
	});

	it('leaves the other columns free to wrap', () => {
		const table = renderList();

		for (const row of within(table).getAllByRole('row').slice(1)) {
			for (const cell of within(row).getAllByRole('cell').slice(0, 3)) {
				expect(cell).toHaveClass('break-words');
				expect(cell).not.toHaveClass('md:whitespace-nowrap');
			}
		}
	});
});
