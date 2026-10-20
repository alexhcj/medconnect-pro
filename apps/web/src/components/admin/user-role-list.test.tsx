import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {UserRoleList} from '@/components/admin/user-role-list';
import {ApiError} from '@/lib/api/http';
import type {PracticeUser} from '@/types/admin/practice-user';

const {useAdminUsers, useAssignUserRole, push, searchParams} = vi.hoisted(() => ({
	useAdminUsers: vi.fn(),
	useAssignUserRole: vi.fn(),
	push: vi.fn(),
	searchParams: {current: new URLSearchParams()},
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
	usePathname: () => '/dashboard/admin',
	useSearchParams: () => searchParams.current,
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

function pageOf(items: PracticeUser[], total = items.length) {
	return {items, total, hasMore: false};
}

function mockUsers(overrides: Record<string, unknown> = {}) {
	useAdminUsers.mockReturnValue({
		data: pageOf([sampleAdmin]),
		isPending: false,
		isError: false,
		isPlaceholderData: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('UserRoleList', () => {
	beforeEach(() => {
		push.mockClear();
		searchParams.current = new URLSearchParams();
		useAssignUserRole.mockReturnValue(idleAssign());
	});

	it('renders user emails and a labeled role control', () => {
		mockUsers();
		render(<UserRoleList />);

		const list = screen.getByRole('table', {name: 'Practice users'});
		expect(list).toHaveTextContent('practice.admin@example.test');
		const select = screen.getByRole('combobox', {name: 'Role for practice.admin@example.test'});
		expect(select).toHaveValue('PRACTICE_ADMIN');
		expect(
			screen.getByText('Synthetic practice directory. Change a membership role for this practice.'),
		).toBeInTheDocument();
	});

	it('omits SUPER_ADMIN from grant options unless it is the current role', () => {
		mockUsers({data: pageOf([sampleProvider, sampleSuperAdmin])});
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
		mockUsers({data: pageOf([{...sampleProvider, role: 'NURSE'}])});
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
		mockUsers({data: pageOf([sampleProvider])});
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
		mockUsers({data: pageOf([sampleProvider])});
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
		expect(screen.queryByRole('table', {name: 'Practice users'})).not.toBeInTheDocument();
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
		mockUsers({data: {items: [], total: 0, hasMore: false}});
		render(<UserRoleList />);

		expect(screen.getByText('No practice users to display.')).toBeInTheDocument();
	});

	it('requests one page of users and shows the range and total', () => {
		searchParams.current = new URLSearchParams('usersPage=2');
		const rows = Array.from({length: 25}, (_, index) => ({...sampleProvider, id: `user_${index}`, email: `u${index}@example.test`}));
		mockUsers({data: pageOf(rows, 312)});
		render(<UserRoleList />);

		expect(useAdminUsers).toHaveBeenCalledWith({page: 2, q: undefined, role: undefined});
		expect(screen.getByText(/Showing 26–50 of 312 users/)).toBeInTheDocument();
		expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(26);
		expect(screen.getByRole('navigation', {name: 'Practice users pagination'})).toBeInTheDocument();
	});

	it('searches on the Search button and on Enter, resetting to page 1', async () => {
		searchParams.current = new URLSearchParams('usersPage=3&auditPage=2');
		mockUsers();
		const user = userEvent.setup();
		render(<UserRoleList />);

		const search = screen.getByRole('searchbox', {name: 'Search users'});
		await user.type(search, 'nurse');
		expect(push).not.toHaveBeenCalled();

		await user.click(screen.getByRole('button', {name: 'Search'}));
		expect(push).toHaveBeenLastCalledWith('/dashboard/admin?auditPage=2&usersQ=nurse', {
			scroll: false,
		});

		push.mockClear();
		await user.type(search, '{Enter}');
		expect(push).toHaveBeenCalledOnce();
	});

	it('filters by role and resets to page 1', async () => {
		searchParams.current = new URLSearchParams('usersPage=3&usersQ=nurse');
		mockUsers();
		const user = userEvent.setup();
		render(<UserRoleList />);

		expect(screen.getByRole('searchbox', {name: 'Search users'})).toHaveValue('nurse');
		await user.selectOptions(screen.getByRole('combobox', {name: 'Role'}), 'PROVIDER');
		expect(push).toHaveBeenLastCalledWith('/dashboard/admin?usersQ=nurse&usersRole=PROVIDER', {
			scroll: false,
		});
	});

	it('shows no-match copy for a search and keeps the filters visible', () => {
		searchParams.current = new URLSearchParams('usersQ=nobody');
		mockUsers({data: {items: [], total: 0, hasMore: false}});
		render(<UserRoleList />);

		expect(screen.getByText('No users match this search.')).toBeInTheDocument();
		expect(screen.getByRole('searchbox', {name: 'Search users'})).toHaveValue('nobody');
		expect(screen.getByRole('button', {name: 'Clear filters'})).toBeInTheDocument();
	});

	it('offers a way back when the page is past the end', async () => {
		searchParams.current = new URLSearchParams('usersPage=9');
		mockUsers({data: {items: [], total: 40, hasMore: false}});
		const user = userEvent.setup();
		render(<UserRoleList />);

		expect(screen.getByRole('status')).toHaveTextContent('Page 9 is past the end');
		await user.click(screen.getByRole('button', {name: 'Back to first page'}));
		expect(push).toHaveBeenLastCalledWith('/dashboard/admin', {scroll: false});
	});

	it('disables the controls while the next page loads', () => {
		mockUsers({isPlaceholderData: true});
		render(<UserRoleList />);

		expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
	});
});
