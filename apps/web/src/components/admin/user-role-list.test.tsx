import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {UserRoleList} from '@/components/admin/user-role-list';
import {ApiError} from '@/lib/api/http';
import type {PracticeUser} from '@/types/admin/practice-user';

const {useAdminUsers, useAssignUserRole} = vi.hoisted(() => ({
	useAdminUsers: vi.fn(),
	useAssignUserRole: vi.fn(),
}));

vi.mock('@/lib/hooks/use-admin', () => ({
	useAdminUsers,
	useAssignUserRole,
}));

const sampleAdmin: PracticeUser = {
	id: 'user_mock_practice_admin',
	email: 'practice.admin@example.test',
	role: 'PRACTICE_ADMIN',
	practiceId: 'demo-practice-001',
	synthetic: true,
};

const sampleProvider: PracticeUser = {
	id: 'user_mock_provider',
	email: 'provider@example.test',
	role: 'PROVIDER',
	practiceId: 'demo-practice-001',
	synthetic: true,
};

const sampleSuperAdmin: PracticeUser = {
	id: 'user_mock_super_admin',
	email: 'super.admin@example.test',
	role: 'SUPER_ADMIN',
	practiceId: 'demo-practice-001',
	synthetic: true,
};

function idleAssign(overrides: Record<string, unknown> = {}) {
	return {
		mutate: vi.fn(),
		isPending: false,
		isSuccess: false,
		isError: false,
		error: null,
		variables: undefined,
		...overrides,
	};
}

function mockUsers(overrides: Record<string, unknown> = {}) {
	useAdminUsers.mockReturnValue({
		data: [sampleAdmin],
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('UserRoleList', () => {
	beforeEach(() => {
		useAssignUserRole.mockReturnValue(idleAssign());
	});

	it('renders user emails and a labeled role control', () => {
		mockUsers();
		render(<UserRoleList />);

		const list = screen.getByRole('list', {name: 'Practice users'});
		expect(list).toHaveTextContent('practice.admin@example.test');
		const select = screen.getByRole('combobox', {name: 'Role for practice.admin@example.test'});
		expect(select).toHaveValue('PRACTICE_ADMIN');
		expect(
			screen.getByText('Synthetic practice directory. Change a membership role for this practice.'),
		).toBeInTheDocument();
	});

	it('omits SUPER_ADMIN from grant options unless it is the current role', () => {
		mockUsers({data: [sampleProvider, sampleSuperAdmin]});
		render(<UserRoleList />);

		const providerSelect = screen.getByRole('combobox', {name: 'Role for provider@example.test'});
		expect(providerSelect).not.toHaveTextContent('SUPER_ADMIN');
		expect(providerSelect).toHaveTextContent('NURSE');

		const superSelect = screen.getByRole('combobox', {name: 'Role for super.admin@example.test'});
		expect(superSelect).toHaveValue('SUPER_ADMIN');
		expect(superSelect).toHaveTextContent('SUPER_ADMIN');
	});

	it('assigns a new role from the keyboard-accessible select and shows success', async () => {
		const mutate = vi.fn();
		mockUsers({data: [{...sampleProvider, role: 'NURSE'}]});
		useAssignUserRole.mockReturnValue(
			idleAssign({
				mutate,
				isSuccess: true,
				variables: {userId: sampleProvider.id, role: 'NURSE'},
			}),
		);
		render(<UserRoleList />);

		const select = screen.getByRole('combobox', {name: 'Role for provider@example.test'});
		expect(select).toHaveValue('NURSE');
		expect(screen.getByRole('status')).toHaveTextContent('Role updated');

		const user = userEvent.setup();
		await user.selectOptions(select, 'PROVIDER');
		expect(mutate).toHaveBeenCalledWith({userId: sampleProvider.id, role: 'PROVIDER'});
	});

	it('surfaces a forbidden grant as an alert instead of silent success', () => {
		mockUsers({data: [sampleProvider]});
		useAssignUserRole.mockReturnValue(
			idleAssign({
				isError: true,
				error: new ApiError('You do not have permission to perform this action', 403, {
					code: 'FORBIDDEN',
				}),
				variables: {userId: sampleProvider.id, role: 'SUPER_ADMIN'},
			}),
		);
		render(<UserRoleList />);

		expect(screen.getByRole('alert')).toHaveTextContent(
			'You do not have permission to perform this action',
		);
		expect(screen.getByRole('combobox', {name: 'Role for provider@example.test'})).toHaveValue(
			'PROVIDER',
		);
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});

	it('disables the role control while that row is submitting', () => {
		mockUsers({data: [sampleProvider]});
		useAssignUserRole.mockReturnValue(
			idleAssign({
				isPending: true,
				variables: {userId: sampleProvider.id, role: 'NURSE'},
			}),
		);
		render(<UserRoleList />);

		expect(screen.getByRole('combobox', {name: 'Role for provider@example.test'})).toBeDisabled();
		expect(screen.getByText('Saving role')).toBeInTheDocument();
	});

	it('shows a loading state', () => {
		mockUsers({data: undefined, isPending: true});
		render(<UserRoleList />);

		expect(screen.getByText('Loading practice users')).toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Practice users'})).not.toBeInTheDocument();
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		mockUsers({data: undefined, isError: true, refetch});
		const user = userEvent.setup();
		render(<UserRoleList />);

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load practice users.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(refetch).toHaveBeenCalledOnce();
	});

	it('shows an empty message', () => {
		mockUsers({data: []});
		render(<UserRoleList />);

		expect(screen.getByText('No practice users to display.')).toBeInTheDocument();
	});
});
