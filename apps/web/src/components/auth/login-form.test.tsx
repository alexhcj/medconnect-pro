import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {LoginForm} from '@/components/auth/login-form';
import {clearMockSession, readMockSession} from '@/lib/api/mocks/mock-session-store';
import {sessionMockAPI} from '@/lib/api/mocks/session-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';
import {RateLimitedError} from '@/lib/api/http';

vi.mock('@/lib/api/mocks/runtime', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/lib/api/mocks/runtime')>();
	return {
		...actual,
		isMockMode: vi.fn(() => true),
	};
});

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

const DEMO_FLAG = 'NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS';
const OAUTH_FLAG = 'NEXT_PUBLIC_OAUTH_ENABLED';
const OAUTH_PROVIDER = 'NEXT_PUBLIC_OAUTH_PROVIDER';
const OAUTH_UNAVAILABLE = 'Provider sign-in is not configured for this demo. Use a demo account.';

function setEnv(name: string, value: string | undefined) {
	if (value === undefined) {
		delete process.env[name];
		return;
	}
	process.env[name] = value;
}

function setDemoFlag(value: string | undefined) {
	setEnv(DEMO_FLAG, value);
}

describe('LoginForm', () => {
	beforeEach(() => {
		clearMockSession();
		push.mockReset();
		searchParams = new URLSearchParams();
		vi.mocked(isMockMode).mockReturnValue(true);
		setDemoFlag(undefined);
		setEnv(OAUTH_FLAG, undefined);
		setEnv(OAUTH_PROVIDER, undefined);
	});

	afterEach(() => {
		setDemoFlag(undefined);
		setEnv(OAUTH_FLAG, undefined);
		setEnv(OAUTH_PROVIDER, undefined);
		vi.restoreAllMocks();
	});

	it('labels the mock identity provider without listing credentials', () => {
		renderLogin();
		expect(screen.getByRole('heading', {name: 'Sign in'})).toBeInTheDocument();
		expect(screen.getAllByRole('note').some((note) => /mock identity provider/i.test(note.textContent ?? ''))).toBe(true);
		expect(screen.queryByText('Demo accounts')).toBeNull();
		expect(screen.queryByText(fixtureDemoUsers[0].email)).toBeNull();
	});

	it.each([undefined, 'false', '1', ''])('hides demo emails and passwords when the flag is %s', (value) => {
		setDemoFlag(value);
		renderLogin();
		expect(screen.queryByText('Demo accounts')).toBeNull();
		for (const user of fixtureDemoUsers) {
			expect(screen.queryByText(user.email)).toBeNull();
			expect(screen.queryByText(user.password)).toBeNull();
		}
	});

	it('shows the four role buttons when the flag is true, without filling the form', () => {
		setDemoFlag('true');
		renderLogin();
		for (const label of ['Practice admin', 'Provider', 'MFA nurse', 'Patient']) {
			expect(screen.getByRole('button', {name: `Fill sign-in as ${label}`})).toHaveAttribute('aria-pressed', 'false');
		}
		expect(screen.getByText('practice.admin@example.test')).toBeInTheDocument();
		expect(screen.queryByText('provider@example.test')).toBeNull();
		expect(screen.queryByText('nurse@example.test')).toBeNull();
		expect(screen.getByText(/MFA nurse code:/)).toHaveTextContent('135790');
		expect(screen.getByLabelText('Email')).toHaveValue('');
		expect(screen.getByLabelText('Password')).toHaveValue('');
	});

	it('fills both fields with one tap, shows the status line and focuses Sign in', async () => {
		setDemoFlag('true');
		const user = userEvent.setup();
		renderLogin();

		await user.click(screen.getByRole('button', {name: 'Fill sign-in as Provider'}));

		expect(screen.getByLabelText('Email')).toHaveValue('jordan.ellis@synthetic.example');
		expect(screen.getByLabelText('Password')).toHaveValue('Demo-Provider-1');
		expect(screen.getByRole('button', {name: 'Fill sign-in as Provider'})).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByText('Filled as Provider. Press Sign in.')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Sign in'})).toHaveFocus();
		expect(push).not.toHaveBeenCalled();
	});

	it('reaches the dashboard by pressing Sign in after a fill, without typing', async () => {
		setDemoFlag('true');
		const user = userEvent.setup();
		renderLogin();

		await user.click(screen.getByRole('button', {name: 'Fill sign-in as Practice admin'}));
		await user.keyboard('{Enter}');

		await vi.waitFor(() => {
			expect(push).toHaveBeenCalledWith('/dashboard');
		});
	});

	it('reaches the mock MFA challenge after filling as the MFA nurse', async () => {
		setDemoFlag('true');
		const user = userEvent.setup();
		const login = vi.spyOn(sessionMockAPI, 'login').mockResolvedValue({
			kind: 'mfa',
			mfaToken: 'opaque-mfa',
			expiresIn: 300,
		});
		renderLogin();

		await user.click(screen.getByRole('button', {name: 'Fill sign-in as MFA nurse'}));
		await user.click(screen.getByRole('button', {name: 'Sign in'}));

		expect(await screen.findByRole('heading', {name: 'Verify mock MFA'})).toBeInTheDocument();
		expect(login).toHaveBeenCalledWith('mfa.nurse@example.test', 'Demo-Mfa-1');
	});

	it('clears the selected role when a filled field is edited', async () => {
		setDemoFlag('true');
		const user = userEvent.setup();
		renderLogin();

		await user.click(screen.getByRole('button', {name: 'Fill sign-in as Patient'}));
		await user.type(screen.getByLabelText('Password'), 'x');

		expect(screen.getByRole('button', {name: 'Fill sign-in as Patient'})).toHaveAttribute('aria-pressed', 'false');
		expect(screen.queryByText('Filled as Patient. Press Sign in.')).toBeNull();
		expect(screen.getByText('Preview: Practice admin. Tap a role to fill the sign-in form.')).toBeInTheDocument();
	});

	it('clears a previous sign-in error when a role is tapped', async () => {
		setDemoFlag('true');
		const user = userEvent.setup();
		renderLogin();

		await user.type(screen.getByLabelText('Email'), 'nobody@example.test');
		await user.type(screen.getByLabelText('Password'), 'not-the-demo');
		await user.click(screen.getByRole('button', {name: 'Sign in'}));
		expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();

		await user.click(screen.getByRole('button', {name: 'Fill sign-in as Provider'}));
		expect(screen.queryByText('Invalid email or password.')).toBeNull();
	});

	it('disables the role buttons while a sign-in is in flight', async () => {
		setDemoFlag('true');
		const user = userEvent.setup();
		vi.spyOn(sessionMockAPI, 'login').mockReturnValue(new Promise(() => {}));
		renderLogin();

		await user.click(screen.getByRole('button', {name: 'Fill sign-in as Provider'}));
		await user.click(screen.getByRole('button', {name: 'Sign in'}));

		await vi.waitFor(() => {
			expect(screen.getByRole('button', {name: 'Fill sign-in as Patient'})).toBeDisabled();
		});
		expect(screen.getByRole('button', {name: 'Copy email for Provider'})).toBeEnabled();
	});

	it.each([undefined, 'false', '1', ''])(
		'hides the provider button and start URLs when OAuth is %s',
		(value) => {
			setEnv(OAUTH_FLAG, value);
			setEnv(OAUTH_PROVIDER, 'google');
			const {container} = renderLogin();
			const helper = screen.getByText(OAUTH_UNAVAILABLE);
			expect(helper).toHaveAttribute('role', 'note');
			expect(helper).not.toHaveAttribute('aria-hidden');
			expect(screen.queryByRole('button', {name: /continue with/i})).toBeNull();
			expect(container.innerHTML).not.toContain('/auth/oauth/fake/start');
			expect(container.innerHTML).not.toContain('/auth/oauth/google/start');
			expect(container.textContent).not.toContain('or sign in with email');
		},
	);

	it('labels the provider button unavailable in mock mode when OAuth is enabled', () => {
		setEnv(OAUTH_FLAG, 'true');
		renderLogin();
		const button = screen.getByRole('button', {name: /continue with fake provider/i});
		expect(button).toBeDisabled();
		expect(button).toHaveAccessibleDescription(/unavailable in mock mode/i);
		expect(screen.queryByText(OAUTH_UNAVAILABLE)).toBeNull();
		expect(document.body.textContent).toContain('or sign in with email');
	});

	it('starts local Fake OAuth when the flag is on and mocks are off', async () => {
		const user = userEvent.setup();
		setEnv(OAUTH_FLAG, 'true');
		vi.mocked(isMockMode).mockReturnValue(false);
		const assign = vi.fn();
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: {assign},
		});
		renderLogin();

		await user.click(screen.getByRole('button', {name: /continue with fake provider/i}));

		expect(assign).toHaveBeenCalledTimes(1);
		const target = String(assign.mock.calls[0]?.[0]);
		expect(target).toContain('/auth/oauth/fake/start');
		expect(target).not.toContain('/auth/oauth/google/start');
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
