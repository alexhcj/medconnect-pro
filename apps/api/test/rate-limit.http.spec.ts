import {Logger, type INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {CLOCK, type Clock} from '../src/identity/clock.js';
import {configureApp} from '../src/platform/configure-app.js';
import {DEV_RATE_LIMIT_KEY_SECRET} from '../src/platform/env.schema.js';
import {InMemoryRateLimitStore} from '../src/rate-limit/in-memory-rate-limit-store.js';
import {hashRateLimitKey} from '../src/rate-limit/rate-limit-key.js';
import {RATE_LIMIT_STORE, type RateLimitStore} from '../src/rate-limit/rate-limit-store.js';
import {PROBE_LIMIT, PROBE_WINDOW_MS, RateLimitProbeController} from './rate-limit-probe.controller.js';

class ProbeStore implements RateLimitStore {
	readonly memory = new InMemoryRateLimitStore();
	readonly keyHashes: string[] = [];
	failing = false;

	increment(policy: string, keyHash: string, windowMs: number, now: Date) {
		this.keyHashes.push(keyHash);
		if (this.failing) {
			return Promise.reject(new Error('store down'));
		}
		return this.memory.increment(policy, keyHash, windowMs, now);
	}

	peek(policy: string, keyHash: string, windowMs: number, now: Date) {
		return this.memory.peek(policy, keyHash, windowMs, now);
	}

	reset(): void {
		this.memory.reset();
		this.keyHashes.length = 0;
		this.failing = false;
	}
}

describe('Rate-limit platform (HTTP)', () => {
	let app: INestApplication;
	const store = new ProbeStore();
	let nowMs = Date.UTC(2026, 0, 1, 0, 0, 10);
	const clock: Clock = {now: () => new Date(nowMs)};

	function setTrustProxy(hops: number): void {
		(app.getHttpAdapter().getInstance() as {set(name: string, value: unknown): void}).set(
			'trust proxy',
			hops,
		);
	}

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
			controllers: [RateLimitProbeController],
		})
			.overrideProvider(RATE_LIMIT_STORE)
			.useValue(store)
			.overrideProvider(CLOCK)
			.useValue(clock)
			.compile();
		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		store.reset();
		nowMs = Date.UTC(2026, 0, 1, 0, 0, 10);
		setTrustProxy(0);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('allows N requests, then returns 429 with envelope and Retry-After', async () => {
		for (let i = 0; i < PROBE_LIMIT; i += 1) {
			await request(app.getHttpServer()).get('/__test/rate-limit/closed').expect(200);
		}
		const res = await request(app.getHttpServer()).get('/__test/rate-limit/closed').expect(429);
		expect(res.headers['retry-after']).toBe('50');
		expect(res.body).toMatchObject({
			error: {code: 'RATE_LIMITED', details: {retryAfterSeconds: 50}},
			correlationId: expect.any(String),
		});
	});

	it('resets the count after the window', async () => {
		for (let i = 0; i <= PROBE_LIMIT; i += 1) {
			await request(app.getHttpServer()).get('/__test/rate-limit/closed');
		}
		nowMs += PROBE_WINDOW_MS;
		await request(app.getHttpServer()).get('/__test/rate-limit/closed').expect(200);
	});

	it('leaves routes without @RateLimit untouched', async () => {
		for (let i = 0; i <= PROBE_LIMIT + 1; i += 1) {
			await request(app.getHttpServer()).get('/__test/rate-limit/unlimited').expect(200);
		}
		expect(store.keyHashes).toHaveLength(0);
	});

	it('ignores X-Forwarded-For when TRUST_PROXY=0', async () => {
		for (const xff of ['203.0.113.1', '203.0.113.2', '198.51.100.7']) {
			await request(app.getHttpServer())
				.get('/__test/rate-limit/closed')
				.set('X-Forwarded-For', xff);
		}
		expect(new Set(store.keyHashes).size).toBe(1);
		await request(app.getHttpServer())
			.get('/__test/rate-limit/closed')
			.set('X-Forwarded-For', '192.0.2.99')
			.expect(429);
	});

	it('uses the right-most untrusted hop when TRUST_PROXY=1', async () => {
		setTrustProxy(1);
		await request(app.getHttpServer())
			.get('/__test/rate-limit/closed')
			.set('X-Forwarded-For', '198.51.100.7, 203.0.113.5')
			.expect(200);
		expect(store.keyHashes[0]).toBe(
			hashRateLimitKey(DEV_RATE_LIMIT_KEY_SECRET, 'probe.closed', '203.0.113.5'),
		);
		for (let i = 0; i < PROBE_LIMIT; i += 1) {
			await request(app.getHttpServer())
				.get('/__test/rate-limit/closed')
				.set('X-Forwarded-For', `10.0.0.${i}, 203.0.113.6`)
				.expect(200);
		}
	});

	it('fails closed with 503 when the store is unavailable', async () => {
		store.failing = true;
		const res = await request(app.getHttpServer()).get('/__test/rate-limit/closed').expect(503);
		expect(res.body.error).toEqual({
			code: 'RATE_LIMIT_UNAVAILABLE',
			message: 'Service temporarily unavailable. Try again later.',
		});
		expect(res.headers['retry-after']).toBeUndefined();
	});

	it('fails open and logs no key material or IP', async () => {
		const warn = vi.spyOn(Logger.prototype, 'warn');
		store.failing = true;
		setTrustProxy(1);
		await request(app.getHttpServer())
			.get('/__test/rate-limit/open')
			.set('X-Forwarded-For', '203.0.113.9')
			.expect(200);
		expect(warn).toHaveBeenCalledTimes(1);
		const logged = JSON.stringify(warn.mock.calls);
		expect(logged).toContain('probe.open');
		expect(logged).not.toContain('203.0.113.9');
		expect(logged).not.toContain('127.0.0.1');
		expect(logged).not.toContain(store.keyHashes[0]);
	});
});
