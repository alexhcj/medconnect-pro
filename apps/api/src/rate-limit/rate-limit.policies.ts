import {MFA_COOKIE_NAME, readCookie} from '../identity/session-cookies.js';
import {clientIp} from './client-ip.js';
import {normalizeEmail} from './rate-limit-key.js';
import type {RateLimitPolicy, RateLimitRequest} from './rate-limit.policy.js';

const MINUTE_MS = 60 * 1000;

function bodyString(req: RateLimitRequest, field: string): string | undefined {
	const body: unknown = req.body;
	if (!body || typeof body !== 'object') {
		return undefined;
	}
	const value = (body as Record<string, unknown>)[field];
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Trimmed, lowercased email from the raw body; runs before validation. */
export function normalizedLoginEmail(req: RateLimitRequest): string | undefined {
	const raw = bodyString(req, 'email');
	const email = raw === undefined ? '' : normalizeEmail(raw);
	return email ? email : undefined;
}

/** MFA token from the JSON body, else the HttpOnly `mcp_mfa` cookie. */
export function mfaTokenFrom(req: RateLimitRequest): string | undefined {
	return bodyString(req, 'mfaToken') ?? readCookie(req, MFA_COOKIE_NAME);
}

const byIp = (req: RateLimitRequest) => clientIp(req);
const bySessionUser = (req: RateLimitRequest) => req.authUserId;

function ipPolicy(name: string, limit: number, windowMs: number): RateLimitPolicy {
	return {name, limit, windowMs, failure: 'closed', key: byIp};
}

function sessionUserPolicy(name: string, limit: number, windowMs: number): RateLimitPolicy {
	return {name, limit, windowMs, failure: 'open', key: bySessionUser, audit: 'session_user'};
}

/** ADR-015 policy table. Limits are code constants and may be tuned here. */
export const RATE_LIMIT_POLICIES = {
	loginDevice: {
		name: 'auth.login.account',
		limit: 5,
		windowMs: 15 * MINUTE_MS,
		failure: 'closed',
		key: (req) => {
			const email = normalizedLoginEmail(req);
			return email ? `${clientIp(req)}|${email}` : undefined;
		},
		audit: 'login_email',
	},
	loginIp: ipPolicy('auth.login.ip', 20, 15 * MINUTE_MS),
	/**
	 * Failed password attempts per normalized email from any IP. Not a guard policy: AuthService
	 * peeks it before credentials and increments it on failure (ADR-015 amendment).
	 */
	loginAccountFailures: {
		name: 'auth.login.account_failures',
		limit: 10,
		windowMs: 15 * MINUTE_MS,
		failure: 'closed',
		key: normalizedLoginEmail,
		audit: 'login_email',
	},
	mfaVerify: {
		name: 'auth.mfa.verify',
		limit: 5,
		windowMs: 10 * MINUTE_MS,
		failure: 'closed',
		key: (req) => {
			const token = mfaTokenFrom(req);
			return token ? `${token}|${clientIp(req)}` : undefined;
		},
		audit: 'mfa_session',
	},
	refresh: ipPolicy('auth.refresh', 30, 5 * MINUTE_MS),
	oauthStart: ipPolicy('auth.oauth.start', 20, 5 * MINUTE_MS),
	oauthCallback: ipPolicy('auth.oauth.callback', 20, 5 * MINUTE_MS),
	oauthFakeAuthorize: ipPolicy('auth.oauth.fake_authorize', 20, 5 * MINUTE_MS),
	mediaToken: sessionUserPolicy('telehealth.media_token', 30, 5 * MINUTE_MS),
	documentDownload: sessionUserPolicy('documents.download', 60, 5 * MINUTE_MS),
	payment: sessionUserPolicy('billing.payment', 10, 5 * MINUTE_MS),
} satisfies Record<string, RateLimitPolicy>;
