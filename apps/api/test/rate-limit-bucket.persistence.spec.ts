import {createHash, randomUUID} from 'node:crypto';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {DataSource, Like} from 'typeorm';
import {RateLimitBucket} from '../src/persistence/entities/rate-limit-bucket.entity.js';
import {RateLimitBucketRepository} from '../src/rate-limit/rate-limit-bucket.repository.js';
import {createAdminDataSource, createAppDataSource} from './admin-data-source.js';

const WINDOW_MS = 60_000;

function keyHash(): string {
	return createHash('sha256').update(randomUUID()).digest('hex');
}

describe('Rate-limit bucket persistence', () => {
	let admin: DataSource;
	let app: DataSource;
	let buckets: RateLimitBucketRepository;
	const prefix = `test-${randomUUID().slice(0, 8)}`;
	const policy = `${prefix}-a`;
	const now = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS + 1_000);

	beforeAll(async () => {
		admin = await createAdminDataSource();
		app = await createAppDataSource();
		buckets = new RateLimitBucketRepository(app.getRepository(RateLimitBucket));
	});

	afterAll(async () => {
		await admin.getRepository(RateLimitBucket).delete({policy: Like(`${prefix}%`)});
		await app.destroy();
		await admin.destroy();
	});

	it('counts hits within one window with a fixed reset time', async () => {
		const key = keyHash();
		const resetAt = new Date(now.getTime() - 1_000 + WINDOW_MS);
		expect(await buckets.increment(policy, key, WINDOW_MS, now)).toEqual({count: 1, resetAt});
		expect(await buckets.increment(policy, key, WINDOW_MS, now)).toEqual({count: 2, resetAt});
		expect(await buckets.increment(policy, key, WINDOW_MS, new Date(now.getTime() + 5_000))).toEqual({
			count: 3,
			resetAt,
		});
	});

	it('loses no updates under concurrent increments on one key', async () => {
		const key = keyHash();
		const results = await Promise.all(
			Array.from({length: 50}, () => buckets.increment(policy, key, WINDOW_MS, now)),
		);
		expect(results.map((r) => r.count).sort((a, b) => a - b)).toEqual(
			Array.from({length: 50}, (_, i) => i + 1),
		);
		const row = await admin.getRepository(RateLimitBucket).findOneByOrFail({policy, keyHash: key});
		expect(row.count).toBe(50);
	});

	it('resets in a new window and keeps policies independent', async () => {
		const key = keyHash();
		await buckets.increment(policy, key, WINDOW_MS, now);
		await buckets.increment(policy, key, WINDOW_MS, now);
		const next = await buckets.increment(policy, key, WINDOW_MS, new Date(now.getTime() + WINDOW_MS));
		expect(next.count).toBe(1);
		expect((await buckets.increment(`${prefix}-b`, key, WINDOW_MS, now)).count).toBe(1);
	});

	it('prunes expired rows on increment', async () => {
		const key = keyHash();
		await admin.getRepository(RateLimitBucket).insert({
			policy,
			keyHash: key,
			windowStart: new Date(now.getTime() - 3 * WINDOW_MS),
			count: 4,
			expiresAt: new Date(now.getTime() - 2 * WINDOW_MS),
		});
		await buckets.increment(policy, keyHash(), WINDOW_MS, now);
		expect(await admin.getRepository(RateLimitBucket).findOneBy({policy, keyHash: key})).toBeNull();
	});

	it('stores only hashed keys', async () => {
		await expect(buckets.increment(policy, '203.0.113.7', WINDOW_MS, now)).rejects.toThrow(/hex hash/);
		await expect(
			admin.getRepository(RateLimitBucket).insert({
				policy,
				keyHash: 'user@synthetic.example',
				windowStart: now,
				count: 1,
				expiresAt: now,
			}),
		).rejects.toMatchObject({driverError: {code: '23514'}});
	});

	it('grants the runtime role only DML on this table and adds no row-level security', async () => {
		const grants = (await admin.query(
			`SELECT privilege_type FROM information_schema.role_table_grants
			WHERE grantee = 'medconnect_app' AND table_name = 'rate_limit_buckets'`,
		)) as Array<{privilege_type: string}>;
		expect(grants.map((g) => g.privilege_type).sort()).toEqual([
			'DELETE',
			'INSERT',
			'SELECT',
			'UPDATE',
		]);
		const rls = (await admin.query(
			`SELECT relrowsecurity FROM pg_class WHERE relname = 'rate_limit_buckets'`,
		)) as Array<{relrowsecurity: boolean}>;
		expect(rls).toEqual([{relrowsecurity: false}]);
		const policies = (await admin.query(
			`SELECT 1 FROM pg_policies WHERE tablename = 'rate_limit_buckets'`,
		)) as unknown[];
		expect(policies).toHaveLength(0);
	});
});
