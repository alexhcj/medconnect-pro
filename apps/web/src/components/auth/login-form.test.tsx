import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {LoginForm} from '@/components/auth/login-form';
import {clearMockSession, readMockSession} from '@/lib/api/mocks/mock-session-store';
import {sessionMockAPI} from '@/lib/api/mocks/session-mock';
import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';
import {RateLimitedError} from '@/lib/api/http';

const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
	useSearchParams: () => searchParams,
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
		searchParams = new URLSearchParams();
		vi.restoreAllMocks();
	});

	it('labels the mock identity provider and lists the demo account', () => {
		renderLogin();
		expect(screen.getByRole('heading', {name: 'Sign in'})).toBeInTheDocument();
		expect(screen.getByRole('note')).toHaveTextContent(/mock identity provider/i);
		expect(screen.getByText(fixtureDemoUsers[0].email)).toBeInTheDocument();
	});

	it('labels the provider button unavailable in mock mode', () => {
		renderLogin();
		const button = screen.getByRole('button', {name: /continue with/i});
		expect(button).toBeDisabled();
		expect(button).toHaveAccessibleDescription(/unavailable in mock mode/i);
	});

	it.each([
		['oauth_failed', 'alert', /couldn't sign you in with that provider/i],
		['rate_limited', 'alert', /too many attempts\. try again later\./i],
		['unauthorized', 'status', /your session ended/i],
		['signed_out', 'status', /you have signed out/i],
	])('announces reason=%s', (reason, role, message) => {
		searchParams = new URLSearchParams({reason});
		renderLogin();
		expect(screen.getByRole(role)).toHaveTextContent(message);
	});

	it('ignores unknown reason values', () => {
		searchParams = new URLSearchParams({reason: '<script>'});
		renderLogin();
		expect(screen.queryByRole('alert')).toBeNull();
		expect(screen.queryByRole('status')).toBeNull();
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

	it.each([
		[45, /too many attempts\. try again in 45 seconds\./i],
		[undefined, /too many attempts\. try again later\./i],
	])('announces rate limiting (retry %s) without echoing input', async (retryAfterSeconds, message) => {
		const user = userEvent.setup();
		vi.spyOn(sessionMockAPI, 'login').mockRejectedValue(new RateLimitedError(retryAfterSeconds));
		renderLogin();

		await user.type(screen.getByLabelText('Email'), 'someone@example.test');
		await user.type(screen.getByLabelText('Password'), 'whatever-pass');
		await user.click(screen.getByRole('button', {name: 'Sign in'}));

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent(message);
		expect(alert).not.toHaveTextContent('someone@example.test');
		expect(push).not.toHaveBeenCalled();
	});

	it('shows the mock MFA challenge after Nest requires MFA', async () => {
		const user = userEvent.setup();
		vi.spyOn(sessionMockAPI, 'login').mockResolvedValue({
			kind: 'mfa',
			mfaToken: 'opaque-mfa',
			expiresIn: 300,
		});
		renderLogin();

		await user.type(screen.getByLabelText('Email'), 'mfa.nurse@example.test');
		await user.type(screen.getByLabelText('Password'), 'Demo-Mfa-1');
		await user.click(screen.getByRole('button', {name: 'Sign in'}));

		expect(await screen.findByRole('heading', {name: 'Verify mock MFA'})).toBeInTheDocument();
		expect(screen.getByLabelText('Verification code')).toBeInTheDocument();
		expect(readMockSession()).toBeNull();
		expect(push).not.toHaveBeenCalled();

		await user.click(screen.getByRole('button', {name: 'Back to sign in'}));
		expect(screen.getByRole('heading', {name: 'Sign in'})).toBeInTheDocument();
	});
});
