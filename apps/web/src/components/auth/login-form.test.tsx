import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {LoginForm} from '@/components/auth/login-form';
import {clearMockSession, readMockSession} from '@/lib/api/mocks/mock-session-store';
import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';

const push = vi.fn();

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
}));

function renderLogin() {
	const client = new QueryClient({
		defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
	});
	return render(
		<QueryClientProvider client={client}>
			<LoginForm />
		</QueryClientProvider>,
	);
}

describe('LoginForm', () => {
	beforeEach(() => {
		clearMockSession();
		push.mockReset();
	});

	it('labels the mock identity provider and lists the demo account', () => {
		renderLogin();
		expect(screen.getByRole('heading', {name: 'Sign in'})).toBeInTheDocument();
		expect(screen.getByRole('note')).toHaveTextContent(/mock identity provider/i);
		expect(screen.getByText(fixtureDemoUsers[0].email)).toBeInTheDocument();
	});

	it('signs in with demo credentials and navigates to the dashboard', async () => {
		const user = userEvent.setup();
		const demo = fixtureDemoUsers[0];
		renderLogin();

		await user.type(screen.getByLabelText('Email'), demo.email);
		await user.type(screen.getByLabelText('Password'), demo.password);
		await user.click(screen.getByRole('button', {name: 'Sign in'}));

		await vi.waitFor(() => {
			expect(readMockSession()?.userId).toBe(demo.userId);
			expect(push).toHaveBeenCalledWith('/dashboard');
		});
	});

	it('shows an error for invalid credentials', async () => {
		const user = userEvent.setup();
		renderLogin();

		await user.type(screen.getByLabelText('Email'), 'nobody@example.test');
		await user.type(screen.getByLabelText('Password'), 'not-the-demo');
		await user.click(screen.getByRole('button', {name: 'Sign in'}));

		expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email or password/i);
		expect(readMockSession()).toBeNull();
		expect(push).not.toHaveBeenCalled();
	});
});
