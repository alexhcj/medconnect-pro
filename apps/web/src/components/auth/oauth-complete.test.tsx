import {render, screen} from '@testing-library/react';
import {OAuthComplete} from '@/components/auth/oauth-complete';
import {sessionAPI} from '@/lib/api/session-api';
import type {SessionInfo} from '@/types/auth/session';

const replace = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
	useRouter: () => ({replace}),
	useSearchParams: () => searchParams,
}));

const session: SessionInfo = {
	sessionId: 'live_test',
	userId: '22222222-2222-4222-8222-222222222222',
	userRole: 'NURSE',
	expiresAt: Date.now() + 600_000,
	lastActivity: Date.now(),
	isActive: true,
	permissions: [],
	currentContext: 'dashboard',
};

describe('OAuthComplete', () => {
	beforeEach(() => {
		replace.mockReset();
		searchParams = new URLSearchParams();
		vi.restoreAllMocks();
	});

	it('announces progress and lands on the allowed returnTo', async () => {
		searchParams = new URLSearchParams({returnTo: '/dashboard/patients'});
		vi.spyOn(sessionAPI, 'hydrateSession').mockResolvedValue(session);
		render(<OAuthComplete />);

		expect(screen.getByRole('status')).toHaveTextContent(/signing you in/i);
		await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard/patients'));
	});

	it('falls back to the dashboard for an off-allowlist returnTo', async () => {
		searchParams = new URLSearchParams({returnTo: 'https://evil.example/dashboard'});
		vi.spyOn(sessionAPI, 'hydrateSession').mockResolvedValue(session);
		render(<OAuthComplete />);

		await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
	});

	it('returns to login with oauth_failed on 401', async () => {
		vi.spyOn(sessionAPI, 'hydrateSession').mockRejectedValue(new Error('Unauthorized'));
		render(<OAuthComplete />);

		await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/login?reason=oauth_failed'));
	});
});
