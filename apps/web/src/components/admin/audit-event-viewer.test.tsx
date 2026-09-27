import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AuditEventViewer} from '@/components/admin/audit-event-viewer';
import type {AuditEvent} from '@/types/admin/audit-event';

const {useAuditEvents} = vi.hoisted(() => ({
	useAuditEvents: vi.fn(),
}));

vi.mock('@/lib/hooks/use-admin', () => ({
	useAuditEvents,
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

function mockEvents(overrides: Record<string, unknown> = {}) {
	useAuditEvents.mockReturnValue({
		data: [sampleEvent],
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('AuditEventViewer', () => {
	it('renders synthetic audit metadata without emails', () => {
		mockEvents();
		render(<AuditEventViewer />);

		const list = screen.getByRole('list', {name: 'Audit events'});
		expect(list).toHaveTextContent('auth.login.succeeded');
		expect(list).toHaveTextContent('session');
		expect(list).toHaveTextContent('user_mock_practice_admin');
		expect(list).not.toHaveTextContent('@example.test');
	});

	it('shows a loading state', () => {
		mockEvents({data: undefined, isPending: true});
		render(<AuditEventViewer />);

		expect(screen.getByText('Loading audit events')).toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Audit events'})).not.toBeInTheDocument();
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

	it('shows an empty message', () => {
		mockEvents({data: []});
		render(<AuditEventViewer />);

		expect(screen.getByText('No audit events to display.')).toBeInTheDocument();
	});
});
