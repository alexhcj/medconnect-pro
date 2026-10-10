import type {Request} from 'express';
import type {RequestAuth} from '../identity/auth.guard.js';

export type RateLimitRequest = Request & RequestAuth;

export type RateLimitPolicy = {
	/** Stable name; part of the bucket key and safe to log. */
	name: string;
	limit: number;
	windowMs: number;
	/** `closed` returns 503 when the store fails; `open` lets the request through. */
	failure: 'closed' | 'open';
	/** Raw key material. Returning `undefined` skips this policy for the request. */
	key: (req: RateLimitRequest) => string | undefined;
	/** How to resolve a practice user for `auth.rate_limited`; unset policies never audit. */
	audit?: RateLimitAuditKind;
};

export type RateLimitAuditKind = 'login_email' | 'mfa_session' | 'session_user';
