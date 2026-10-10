import {describe, expect, it} from 'vitest';
import {InMemoryRateLimitStore} from './in-memory-rate-limit-store.js';
import {hashRateLimitKey, normalizeEmail} from './rate-limit-key.js';
import {mfaTokenFrom, normalizedLoginEmail, RATE_LIMIT_POLICIES} from './rate-limit.policies.js';
import type {RateLimitRequest} from './rate-limit.policy.js';

describe('hashRateLimitKey', () => {
	it('returns a 64-char lowercase hex HMAC that hides the raw key', () => {
		const hash = hashRateLimitKey('s'.repeat(32), 'auth.login', '203.0.113.1');
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
		expect(hash).not.toContain('203.0.113.1');
	});

	it('separates policies and secrets', () => {
		const secret = 's'.repeat(32);
		const base = hashRateLimitKey(secret, 'a', 'k');
		expect(hashRateLimitKey(secret, 'b', 'k')).not.toBe(base);
		expect(hashRateLimitKey('t'.repeat(32), 'a', 'k')).not.toBe(base);
		expect(hashRateLimitKey(secret, 'a', 'k')).toBe(base);
	});

	it('normalizes emails before hashing', () => {
		expect(normalizeEmail('  Demo.User@Example.TEST ')).toBe('demo.user@example.test');
	});
});

function fakeRequest(body: unknown, cookie?: string, ip = '203.0.113.1'): RateLimitRequest {
	return {
		body,
		ip,
		header: (name: string) => (name.toLowerCase() === 'cookie' ? cookie : undefined),
	} as unknown as RateLimitRequest;
}

describe('RATE_LIMIT_POLICIES keys', () => {
	it('keys login by IP + normalized email and skips non-string emails', () => {
		const {loginDevice, loginIp} = RATE_LIMIT_POLICIES;
		expect(loginDevice.key(fakeRequest({email: ' Demo@Example.TEST '}))).toBe(
			'203.0.113.1|demo@example.test',
		);
		expect(normalizedLoginEmail(fakeRequest({email: 42}))).toBeUndefined();
		expect(loginDevice.key(fakeRequest(undefined))).toBeUndefined();
		expect(loginDevice.key(fakeRequest({email: '   '}))).toBeUndefined();
		expect(loginIp.key(fakeRequest(undefined))).toBe('203.0.113.1');
	});

	it('keys MFA by body token first, then the mcp_mfa cookie', () => {
		expect(mfaTokenFrom(fakeRequest({mfaToken: 'body-token'}, 'mcp_mfa=cookie-token'))).toBe(
			'body-token',
		);
		expect(mfaTokenFrom(fakeRequest({}, 'mcp_mfa=cookie-token'))).toBe('cookie-token');
		expect(RATE_LIMIT_POLICIES.mfaVerify.key(fakeRequest({}))).toBeUndefined();
	});

	it('keys session-user policies by authUserId and skips anonymous requests', () => {
		const req = fakeRequest({});
		expect(RATE_LIMIT_POLICIES.payment.key(req)).toBeUndefined();
		req.authUserId = 'user-1';
		expect(RATE_LIMIT_POLICIES.payment.key(req)).toBe('user-1');
	});
});

describe('InMemoryRateLimitStore', () => {
	it('counts per fixed window and resets', async () => {
		const store = new InMemoryRateLimitStore();
		const now = new Date(Date.UTC(2026, 0, 1, 0, 0, 30));
		expect(await store.increment('p', 'k', 60_000, now)).toEqual({
			count: 1,
			resetAt: new Date(Date.UTC(2026, 0, 1, 0, 1, 0)),
		});
		expect((await store.increment('p', 'k', 60_000, now)).count).toBe(2);
		expect((await store.increment('p', 'k', 60_000, new Date(now.getTime() + 60_000))).count).toBe(
			1,
		);
		store.reset();
		expect((await store.increment('p', 'k', 60_000, now)).count).toBe(1);
	});
});
