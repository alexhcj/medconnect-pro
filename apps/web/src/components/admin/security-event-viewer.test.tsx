import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SecurityEventViewer} from '@/components/admin/security-event-viewer';
import {ApiError} from '@/lib/api/http';
import type {AuditEvent} from '@/types/admin/audit-event';

const {useSecurityEvents} = vi.hoisted(() => ({
	useSecurityEvents: vi.fn(),
}));

vi.mock('@/lib/hooks/use-admin', () => ({
	useSecurityEvents,
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

function mockEvents(overrides: Record<string, unknown> = {}) {
	useSecurityEvents.mockReturnValue({
		data: [sampleEvent],
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('SecurityEventViewer', () => {
	it('renders synthetic security metadata without emails', () => {
		mockEvents();
		render(<SecurityEventViewer />);

		expect(screen.getByRole('heading', {level: 2, name: 'Security events'})).toBeInTheDocument();
		expect(
			screen.getByText(
				'Tenant-scoped authentication and session events. Synthetic ids only. Not a SIEM or HIPAA audit export.',
			),
		).toBeInTheDocument();
		const list = screen.getByRole('list', {name: 'Security events'});
		expect(list).toHaveTextContent('auth.login.succeeded');
		expect(list).toHaveTextContent('session');
		expect(list).toHaveTextContent('user_mock_practice_admin');
		expect(list).not.toHaveTextContent('@example.test');
		expect(list).not.toHaveTextContent('patient.accessed');
	});

	it('shows a loading state', () => {
		mockEvents({data: undefined, isPending: true});
		render(<SecurityEventViewer />);

		expect(screen.getByText('Loading security events')).toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Security events'})).not.toBeInTheDocument();
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
		expect(screen.queryByRole('list', {name: 'Security events'})).not.toBeInTheDocument();
	});

	it('shows an empty message', () => {
		mockEvents({data: []});
		render(<SecurityEventViewer />);

		expect(screen.getByText('No security events to display.')).toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Security events'})).not.toBeInTheDocument();
	});
});
