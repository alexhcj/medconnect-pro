import {render, screen} from '@testing-library/react';
import AdministrationPage from '@/app/(dashboard)/dashboard/admin/page';
import type {AuditEvent} from '@/types/admin/audit-event';
import type {PracticeUser} from '@/types/admin/practice-user';

const {useAdminUsers, useAuditEvents, useSecurityEvents, useAssignUserRole, useSessionStatus} =
	vi.hoisted(() => ({
		useAdminUsers: vi.fn(),
		useAuditEvents: vi.fn(),
		useSecurityEvents: vi.fn(),
		useAssignUserRole: vi.fn(),
		useSessionStatus: vi.fn(),
	}));

vi.mock('@/lib/hooks/use-admin', () => ({
	useAdminUsers,
	useAuditEvents,
	useSecurityEvents,
	useAssignUserRole,
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useSessionStatus,
}));

const sampleUser: PracticeUser = {
	id: 'user_mock_practice_admin',
	email: 'practice.admin@example.test',
	role: 'PRACTICE_ADMIN',
	practiceId: 'demo-practice-001',
	synthetic: true,
};

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

const sampleSecurityEvent: AuditEvent = {
	id: 'demo-security-002',
	practiceId: 'demo-practice-001',
	actorUserId: 'user_mock_provider',
	action: 'auth.login.failed',
	resourceType: 'session',
	resourceId: null,
	correlationId: 'demo-security-correlation-002',
	createdAt: '2026-10-06T07:52:00.000Z',
};

describe('AdministrationPage', () => {
	beforeEach(() => {
		useAdminUsers.mockClear();
		useAuditEvents.mockClear();
		useSecurityEvents.mockClear();
		useAssignUserRole.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isSuccess: false,
			isError: false,
			error: null,
			variables: undefined,
		});
		useSessionStatus.mockReturnValue({
			session: {userRole: 'PRACTICE_ADMIN'},
			isLoading: false,
		});
		useAdminUsers.mockReturnValue({
			data: [sampleUser],
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
		useAuditEvents.mockReturnValue({
			data: [sampleEvent],
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
		useSecurityEvents.mockReturnValue({
			data: [sampleSecurityEvent],
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
	});

	it('renders the heading, user list, audit viewer, and security-events viewer', () => {
		render(<AdministrationPage />);

		expect(screen.getByRole('heading', {level: 1, name: 'Administration'})).toBeInTheDocument();
		expect(
			screen.getByText(
				'Synthetic demo. Role changes apply to this practice only. Nest enforces grant limits.',
			),
		).toBeInTheDocument();
		expect(screen.getByRole('list', {name: 'Practice users'})).toHaveTextContent(
			'practice.admin@example.test',
		);
		expect(screen.getByRole('combobox', {name: 'Role for practice.admin@example.test'})).toHaveValue(
			'PRACTICE_ADMIN',
		);
		expect(screen.getByRole('list', {name: 'Audit events'})).toHaveTextContent('auth.login.succeeded');
		expect(screen.getByRole('list', {name: 'Security events'})).toHaveTextContent(
			'auth.login.failed',
		);
	});

	it('denies a nurse session without fetching admin lists', () => {
		useSessionStatus.mockReturnValue({
			session: {userRole: 'NURSE'},
			isLoading: false,
		});
		render(<AdministrationPage />);

		expect(screen.getByRole('status')).toHaveTextContent('You do not have access to administration.');
		expect(screen.queryByRole('list', {name: 'Practice users'})).not.toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Audit events'})).not.toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Security events'})).not.toBeInTheDocument();
		expect(useAdminUsers).not.toHaveBeenCalled();
		expect(useAuditEvents).not.toHaveBeenCalled();
		expect(useSecurityEvents).not.toHaveBeenCalled();
	});

	it('shows a session loading state', () => {
		useSessionStatus.mockReturnValue({
			session: undefined,
			isLoading: true,
		});
		render(<AdministrationPage />);

		expect(screen.getByText('Loading administration')).toBeInTheDocument();
		expect(useAdminUsers).not.toHaveBeenCalled();
		expect(useAuditEvents).not.toHaveBeenCalled();
		expect(useSecurityEvents).not.toHaveBeenCalled();
	});
});
