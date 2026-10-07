import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MfaChallengeForm} from '@/components/auth/mfa-challenge-form';
import {ApiError} from '@/lib/api/http';
import {sessionMockAPI} from '@/lib/api/mocks/session-mock';
import {clearMockSession, readMockSession} from '@/lib/api/mocks/mock-session-store';
import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';

const onBack = vi.fn();
const onVerified = vi.fn();

function renderChallenge(expiresIn = 300) {
	const client = new QueryClient({
		defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
	});
	return render(
		<QueryClientProvider client={client}>
			<MfaChallengeForm
				email="mfa.nurse@example.test"
				mfaToken="opaque-mfa"
				expiresIn={expiresIn}
				onBack={onBack}
				onVerified={onVerified}
			/>
		</QueryClientProvider>,
	);
}

describe('MfaChallengeForm', () => {
	beforeEach(() => {
		clearMockSession();
		onBack.mockReset();
		onVerified.mockReset();
		vi.restoreAllMocks();
	});

	it('labels mock MFA and names the code field', () => {
		renderChallenge();
		expect(screen.getByRole('heading', {name: 'Verify mock MFA'})).toBeInTheDocument();
		expect(screen.getByRole('note')).toHaveTextContent(/mock MFA challenge/i);
		expect(screen.getByLabelText('Verification code')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Verify'})).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Back to sign in'})).toBeInTheDocument();
	});

	it('focuses the code field on first paint and tabs to verify', async () => {
		const user = userEvent.setup();
		renderChallenge();
		expect(screen.getByLabelText('Verification code')).toHaveFocus();
		await user.tab();
		expect(screen.getByRole('button', {name: 'Verify'})).toHaveFocus();
	});

	it('shows an accessible error for a wrong code and does not continue', async () => {
		const user = userEvent.setup();
		vi.spyOn(sessionMockAPI, 'verifyMfa').mockRejectedValue(
			new ApiError('MFA verification failed', 401),
		);
		renderChallenge();

		await user.type(screen.getByLabelText('Verification code'), '000000');
		await user.click(screen.getByRole('button', {name: 'Verify'}));

		expect(await screen.findByRole('alert')).toHaveTextContent(/verification failed/i);
		expect(readMockSession()).toBeNull();
		expect(onVerified).not.toHaveBeenCalled();
	});

	it('returns to sign in without verifying', async () => {
		const user = userEvent.setup();
		renderChallenge();
		await user.click(screen.getByRole('button', {name: 'Back to sign in'}));
		expect(onBack).toHaveBeenCalledTimes(1);
		expect(onVerified).not.toHaveBeenCalled();
	});

	it('completes verification and continues', async () => {
		const user = userEvent.setup();
		const mfaNurse = fixtureDemoUsers.find((account) => account.email === 'mfa.nurse@example.test');
		expect(mfaNurse).toBeDefined();
		vi.spyOn(sessionMockAPI, 'verifyMfa').mockImplementation(async () => {
			const session = {
				sessionId: 'live_mfa',
				userId: mfaNurse!.userId,
				userRole: 'NURSE' as const,
				expiresAt: Date.now() + 900_000,
				lastActivity: Date.now(),
				isActive: true,
				permissions: [],
				currentContext: 'dashboard',
			};
			return session;
		});
		renderChallenge();

		await user.type(screen.getByLabelText('Verification code'), '135790');
		await user.click(screen.getByRole('button', {name: 'Verify'}));

		await vi.waitFor(() => {
			expect(onVerified).toHaveBeenCalledTimes(1);
		});
	});

	it('announces expiry and disables verify', () => {
		renderChallenge(0);
		expect(screen.getByRole('alert')).toHaveTextContent(/expired/i);
		expect(screen.getByRole('button', {name: 'Verify'})).toBeDisabled();
		expect(screen.getByLabelText('Verification code')).toBeDisabled();
	});
});
