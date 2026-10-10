import {DASHBOARD_PATH} from '@/lib/auth/paths';
import {nestApiBaseUrl} from '@/lib/api/nest-api';

export type OAuthProvider = 'google' | 'fake';

/** Must match the Nest OIDC adapter; unset uses the local Fake adapter. */
export function configuredOAuthProvider(): OAuthProvider {
	return process.env.NEXT_PUBLIC_OAUTH_PROVIDER?.trim() === 'google' ? 'google' : 'fake';
}

export function oauthStartUrl(provider: OAuthProvider, returnTo: string = DASHBOARD_PATH): string {
	const params = new URLSearchParams({returnTo});
	return `${nestApiBaseUrl()}/auth/oauth/${provider}/start?${params.toString()}`;
}

/** Only relative paths under /dashboard; anything else falls back to the dashboard. */
export function safeReturnTo(value: string | null): string {
	if (!value || !value.startsWith(DASHBOARD_PATH) || value.startsWith('//')) {
		return DASHBOARD_PATH;
	}
	const rest = value.slice(DASHBOARD_PATH.length);
	return rest === '' || rest.startsWith('/') || rest.startsWith('?') ? value : DASHBOARD_PATH;
}

export const LOGIN_REASON_MESSAGES = {
	oauth_failed: "We couldn't sign you in with that provider. Try again or use email.",
	rate_limited: 'Too many attempts. Try again later.',
	unauthorized: 'Your session ended. Sign in again.',
	signed_out: 'You have signed out.',
} as const;

export type LoginReason = keyof typeof LOGIN_REASON_MESSAGES;

export function parseLoginReason(value: string | null): LoginReason | null {
	return value && value in LOGIN_REASON_MESSAGES ? (value as LoginReason) : null;
}
