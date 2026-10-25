import {act, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@/lib/api/mocks/runtime', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/lib/api/mocks/runtime')>();
	return {...actual, isMockMode: vi.fn(() => false)};
});
vi.mock('@/lib/api/session-api', () => ({
	sessionAPI: {login: vi.fn(), verifyMfa: vi.fn()},
}));
vi.mock('@/lib/api/health-api', () => ({checkApiHealth: vi.fn()}));
vi.mock('@/lib/api/wake-ping', () => ({wakePing: vi.fn()}));

const push = vi.fn();
vi.mock('next/navigation', () => ({
	useRouter: () => ({push}),
	useSearchParams: () => new URLSearchParams(),
}));

import {LoginForm} from '@/components/auth/login-form';
import {ApiError, RateLimitedError, ServiceWakingError} from '@/lib/api/http';
import {checkApiHealth} from '@/lib/api/health-api';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {sessionAPI} from '@/lib/api/session-api';
import {wakePing} from '@/lib/api/wake-ping';
import {PROBE_BACKOFF_MS} from '@/lib/api-status/use-api-status';

const login = vi.mocked(sessionAPI.login);
const health = vi.mocked(checkApiHealth);
const session = {kind: 'session' as const, session: {userId: 'u'} as never};
let apiAwake = true;

/** The API goes to sleep as this sign-in attempt reaches it: a bare gateway failure. */
function fallsAsleep() {
	return () => {
		apiAwake = false;
		return Promise.reject(new ServiceWakingError('gateway', 502));
	};
}

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

async function advance(ms: number) {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
	await user.type(screen.getByLabelText('Email'), 'practice.admin@example.test');
	await user.type(screen.getByLabelText('Password'), 'Demo-Admin-1');
	await user.click(screen.getByRole('button', {name: /^sign in$/i}));
	await advance(0);
}

async function signIn(user: ReturnType<typeof userEvent.setup>) {
	await user.type(screen.getByLabelText('Email'), 'practice.admin@example.test');
	await user.type(screen.getByLabelText('Password'), 'Demo-Admin-1');
	await user.click(screen.getByRole('button', {name: /^sign in$/i}));
	await advance(0);
}

describe('LoginForm API wake (FE-049)', () => {
	beforeEach(() => {
		vi.useFakeTimers({shouldAdvanceTime: true});
		vi.mocked(isMockMode).mockReturnValue(false);
		apiAwake = true;
		health.mockReset();
		health.mockImplementation(async () => apiAwake);
		login.mockReset();
		vi.mocked(wakePing).mockReset();
		push.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function user() {
		return userEvent.setup({advanceTimers: vi.advanceTimersByTime});
	}

	it('pings on first field focus, not on mount, and only once', async () => {
		const u = user();
		renderLogin();
		expect(wakePing).not.toHaveBeenCalled();
		expect(health).not.toHaveBeenCalled();
		await u.click(screen.getByLabelText('Email'));
		await u.click(screen.getByLabelText('Password'));
		expect(wakePing).toHaveBeenCalledTimes(1);
	});

	it('shows the waking card and hint, never the generic error, then finishes by itself', async () => {
		const u = user();
		login.mockImplementationOnce(fallsAsleep()).mockResolvedValueOnce(session);
		renderLogin();
		await signIn(u);

		expect(screen.queryByText('Unable to sign in. Try again.')).not.toBeInTheDocument();
		expect(screen.getByText('Server is waking up, see the status indicator')).toBeInTheDocument();
		const submit = screen.getByRole('button', {name: /signing in when ready/i});
		expect(submit).toBeEnabled();
		expect(submit).toHaveAttribute('aria-describedby', 'api-wake-hint');
		expect(screen.getByText('Free tier sleeps when idle. Waking the API, usually about a minute.')).toBeInTheDocument();
		expect(screen.getByText(/Elapsed \d+ s/)).toBeInTheDocument();
		expect(login).toHaveBeenCalledTimes(1);

		apiAwake = true;
		await advance(PROBE_BACKOFF_MS[0] + 50);
		await advance(0);

		expect(login).toHaveBeenCalledTimes(2);
		expect(push).toHaveBeenCalledWith('/dashboard');
		expect(screen.queryByText('Server is waking up, see the status indicator')).not.toBeInTheDocument();
	});

	it('opens the waking card on focus and queues a submit without sending it while asleep', async () => {
		const u = user();
		apiAwake = false;
		login.mockResolvedValue(session);
		renderLogin();
		await u.click(screen.getByLabelText('Email'));
		await advance(0);
		expect(screen.getByText('Waking up', {selector: 'span'})).toBeInTheDocument();
		await signIn(u);
		expect(login).not.toHaveBeenCalled();
		expect(screen.getByRole('button', {name: /signing in when ready/i})).toBeEnabled();

		apiAwake = true;
		await advance(PROBE_BACKOFF_MS[0] + 50);
		await advance(0);
		expect(login).toHaveBeenCalledTimes(1);
		expect(push).toHaveBeenCalledWith('/dashboard');
	});

	it('continues into the MFA step after a queued submit', async () => {
		const u = user();
		login
			.mockImplementationOnce(fallsAsleep())
			.mockResolvedValueOnce({kind: 'mfa', mfaToken: 't', expiresIn: 300});
		renderLogin();
		await signIn(u);
		apiAwake = true;
		await advance(PROBE_BACKOFF_MS[0] + 50);
		await advance(0);
		expect(await screen.findByRole('heading', {name: 'Verify mock MFA'})).toBeInTheDocument();
		expect(login).toHaveBeenCalledTimes(2);
	});

	it('queues a submit made while waking without sending it, and never double-submits', async () => {
		const u = user();
		login.mockImplementationOnce(fallsAsleep()).mockResolvedValue(session);
		renderLogin();
		await signIn(u);
		await u.click(screen.getByRole('button', {name: /signing in when ready/i}));
		await u.click(screen.getByRole('button', {name: /signing in when ready/i}));
		expect(login).toHaveBeenCalledTimes(1);

		apiAwake = true;
		await advance(PROBE_BACKOFF_MS[0] + 50);
		await advance(0);
		expect(login).toHaveBeenCalledTimes(2);
	});

	it('cancel drops the queued sign-in', async () => {
		const u = user();
		login.mockImplementationOnce(fallsAsleep()).mockResolvedValue(session);
		renderLogin();
		await signIn(u);
		await u.click(screen.getByRole('button', {name: 'Cancel'}));
		expect(screen.getByRole('button', {name: /^sign in$/i})).toBeInTheDocument();
		apiAwake = true;
		await advance(PROBE_BACKOFF_MS[0] + 50);
		await advance(0);
		expect(login).toHaveBeenCalledTimes(1);
		expect(push).not.toHaveBeenCalled();
	});

	it('shows the unreachable card with Retry after the cap, keeping the queued sign-in', async () => {
		const u = user();
		login.mockImplementationOnce(fallsAsleep()).mockResolvedValue(session);
		renderLogin();
		await signIn(u);
		await advance(95_000);
		expect(screen.getByText('No response after about 90 s. The API may still be starting.')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Retry'})).toBeInTheDocument();
		apiAwake = true;
		await u.click(screen.getByRole('button', {name: 'Retry'}));
		await advance(50);
		await advance(0);
		expect(login).toHaveBeenCalledTimes(2);
		expect(push).toHaveBeenCalledWith('/dashboard');
	});

	it('leaves 401 and 429 messages unchanged and does not queue', async () => {
		const u = user();
		login.mockRejectedValueOnce(new ApiError('Unauthorized', 401));
		renderLogin();
		await signIn(u);
		expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
		expect(screen.queryByText('Server is waking up, see the status indicator')).not.toBeInTheDocument();

		login.mockRejectedValueOnce(new RateLimitedError(30));
		await u.click(screen.getByRole('button', {name: /^sign in$/i}));
		await advance(0);
		expect(await screen.findByText('Too many attempts. Try again in 30 seconds.')).toBeInTheDocument();
		expect(login).toHaveBeenCalledTimes(2);
	});

	it('treats a 5xx with an error envelope as a plain failure, not a wake', async () => {
		const u = user();
		login.mockRejectedValueOnce(new ApiError('API proxy is not configured', 503, {code: 'SERVICE_UNAVAILABLE'}));
		renderLogin();
		await signIn(u);
		expect(await screen.findByText('Unable to sign in. Try again.')).toBeInTheDocument();
		expect(screen.queryByText('Server is waking up, see the status indicator')).not.toBeInTheDocument();
	});

	it('never replays a sign-in that timed out, since it may have reached the server', async () => {
		const u = user();
		login.mockImplementation(() => {
			apiAwake = false;
			return Promise.reject(new ServiceWakingError('timeout', 504));
		});
		renderLogin();
		await signIn(u);
		expect(await screen.findByText('Unable to sign in. Try again.')).toBeInTheDocument();
		apiAwake = true;
		await advance(PROBE_BACKOFF_MS[0] + 50);
		await advance(0);
		expect(login).toHaveBeenCalledTimes(1);
	});

	it('drops a queued sign-in that waited longer than the queue lifetime', async () => {
		const u = user();
		login.mockImplementationOnce(fallsAsleep()).mockResolvedValue(session);
		renderLogin();
		await signIn(u);
		await advance(95_000);
		vi.setSystemTime(Date.now() + 300_000);
		apiAwake = true;
		await u.click(screen.getByRole('button', {name: 'Retry'}));
		await advance(50);
		await advance(0);
		expect(await screen.findByText('Unable to sign in. Try again.')).toBeInTheDocument();
		expect(login).toHaveBeenCalledTimes(1);
	});

	it('sends a submit made while unreachable instead of only queueing it', async () => {
		const u = user();
		apiAwake = false;
		login.mockResolvedValue(session);
		renderLogin();
		await u.click(screen.getByLabelText('Email'));
		await advance(95_000);
		await fillAndSubmit(u);
		expect(login).toHaveBeenCalledTimes(1);
	});

	it('stops queueing after repeated wakes and shows the generic error', async () => {
		const u = user();
		login.mockImplementation(fallsAsleep());
		renderLogin();
		await signIn(u);
		for (let i = 0; i < 5; i += 1) {
			apiAwake = true;
			await advance(PROBE_BACKOFF_MS[0] + 50);
			await advance(0);
		}
		expect(login.mock.calls.length).toBeLessThanOrEqual(4);
		expect(await screen.findByText('Unable to sign in. Try again.')).toBeInTheDocument();
	});
});

describe('LoginForm without an indicator', () => {
	it('renders no indicator and sends no ping in mock mode', async () => {
		vi.mocked(isMockMode).mockReturnValue(true);
		vi.mocked(wakePing).mockReset();
		const u = userEvent.setup();
		renderLogin();
		await u.click(screen.getByLabelText('Email'));
		expect(screen.queryByRole('button', {name: /api status/i})).not.toBeInTheDocument();
		expect(wakePing).not.toHaveBeenCalled();
	});

	it('renders no indicator in a PR preview', async () => {
		vi.mocked(isMockMode).mockReturnValue(false);
		vi.stubEnv('NEXT_PUBLIC_DEPLOY_CONTEXT', 'pr-preview');
		const u = userEvent.setup();
		renderLogin();
		await u.click(screen.getByLabelText('Email'));
		expect(screen.queryByRole('button', {name: /api status/i})).not.toBeInTheDocument();
		vi.unstubAllEnvs();
	});
});
