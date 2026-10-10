import {randomUUID} from 'node:crypto';
import type {ConfigService} from '@nestjs/config';
import {DataSource} from 'typeorm';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import type {Clock} from '../src/identity/clock.js';
import {RateLimitBucket} from '../src/persistence/entities/rate-limit-bucket.entity.js';
import {DEV_RATE_LIMIT_KEY_SECRET, type Env} from '../src/platform/env.schema.js';
import {AccountLoginLimiter} from '../src/rate-limit/account-login-limiter.js';
import {InMemoryRateLimitStore} from '../src/rate-limit/in-memory-rate-limit-store.js';
import {PostgresRateLimitStore} from '../src/rate-limit/postgres-rate-limit-store.js';
import {RateLimitBucketRepository} from '../src/rate-limit/rate-limit-bucket.repository.js';
import {RateLimitedError, RateLimitUnavailableError} from '../src/rate-limit/rate-limit.errors.js';
import {RATE_LIMIT_POLICIES} from '../src/rate-limit/rate-limit.policies.js';
import type {RateLimitStore} from '../src/rate-limit/rate-limit-store.js';
import {createAppDataSource} from './admin-data-source.js';

const {limit, windowMs, name} = RATE_LIMIT_POLICIES.loginAccountFailures;
const config = {get: () => DEV_RATE_LIMIT_KEY_SECRET} as unknown as ConfigService<Env, true>;

function limiter(store: RateLimitStore, clock: Clock): AccountLoginLimiter {
	return new AccountLoginLimiter(store, clock, config);
}

describe('AccountLoginLimiter', () => {
	it('blocks at the threshold, normalizes email, and recovers after the window', async () => {
		let nowMs = Date.UTC(2026, 0, 1, 0, 0, 5);
		const subject = limiter(new InMemoryRateLimitStore(), {now: () => new Date(nowMs)});
		for (let i = 0; i < limit - 1; i += 1) {
			expect((await subject.recordFailure('user@example.test')).firstRejection).toBe(false);
		}
		await subject.assertAllowed('user@example.test');
		expect((await subject.recordFailure(' USER@example.test ')).firstRejection).toBe(true);
		await expect(subject.assertAllowed('user@example.test')).rejects.toBeInstanceOf(RateLimitedError);
		await expect(subject.assertAllowed('other@example.test')).resolves.toBeUndefined();
		nowMs += windowMs;
		await expect(subject.assertAllowed('user@example.test')).resolves.toBeUndefined();
	});

	it('fails closed when the store is unavailable', async () => {
		const broken: RateLimitStore = {
			increment: () => Promise.reject(new Error('down')),
			peek: () => Promise.reject(new Error('down')),
		};
		const subject = limiter(broken, {now: () => new Date()});
		await expect(subject.assertAllowed('a@example.test')).rejects.toBeInstanceOf(
			RateLimitUnavailableError,
		);
		await expect(subject.recordFailure('a@example.test')).rejects.toBeInstanceOf(
			RateLimitUnavailableError,
		);
	});
});

describe('AccountLoginLimiter on PostgreSQL (shared across instances)', () => {
	let dataSource: DataSource;
	let store: PostgresRateLimitStore;

	beforeAll(async () => {
		dataSource = await createAppDataSource();
		store = new PostgresRateLimitStore(
			new RateLimitBucketRepository(dataSource.getRepository(RateLimitBucket)),
		);
	});

	afterAll(async () => {
		await dataSource?.destroy();
	});

	it('peeks without counting', async () => {
		const subject = limiter(store, {now: () => new Date()});
		const email = `peek.${randomUUID()}@synthetic.example`;
		for (let i = 0; i < limit + 3; i += 1) {
			await subject.assertAllowed(email);
		}
		await subject.recordFailure(email);
		const subject2 = limiter(store, {now: () => new Date()});
		await subject2.assertAllowed(email);
	});

	it('counts concurrent failures from separate limiter instances atomically', async () => {
		const clock: Clock = {now: () => new Date()};
		const email = `race.${randomUUID()}@synthetic.example`;
		const instances = [limiter(store, clock), limiter(store, clock), limiter(store, clock)];
		const results = await Promise.all(
			Array.from({length: limit + 2}, (_, i) => instances[i % instances.length].recordFailure(email)),
		);
		expect(results.filter((result) => result.firstRejection)).toHaveLength(1);
		await expect(instances[0].assertAllowed(email)).rejects.toBeInstanceOf(RateLimitedError);
		expect(name).toBe('auth.login.account_failures');
	});
});
