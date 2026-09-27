import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {UserRoleList} from '@/components/admin/user-role-list';
import type {PracticeUser} from '@/types/admin/practice-user';

const {useAdminUsers} = vi.hoisted(() => ({
	useAdminUsers: vi.fn(),
}));

vi.mock('@/lib/hooks/use-admin', () => ({
	useAdminUsers,
}));

const sampleUser: PracticeUser = {
	id: 'user_mock_practice_admin',
	email: 'practice.admin@example.test',
	role: 'PRACTICE_ADMIN',
	practiceId: 'demo-practice-001',
	synthetic: true,
};

function mockUsers(overrides: Record<string, unknown> = {}) {
	useAdminUsers.mockReturnValue({
		data: [sampleUser],
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('UserRoleList', () => {
	it('renders user emails and catalog roles', () => {
		mockUsers();
		render(<UserRoleList />);

		const list = screen.getByRole('list', {name: 'Practice users'});
		expect(list).toHaveTextContent('practice.admin@example.test');
		expect(list).toHaveTextContent('PRACTICE_ADMIN');
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
