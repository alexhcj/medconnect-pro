import {describe, expect, it} from 'vitest';
import {InMemoryRateLimitStore} from './in-memory-rate-limit-store.js';
import {hashRateLimitKey, normalizeEmail} from './rate-limit-key.js';

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
