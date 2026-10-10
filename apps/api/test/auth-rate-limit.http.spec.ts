import {randomUUID} from 'node:crypto';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {DataSource, In} from 'typeorm';
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {CLOCK, type Clock} from '../src/identity/clock.js';
import {MOCK_IDP_USERS, type MockIdpAccount} from '../src/identity/mock-idp.js';
import {DEFAULT_LOCAL_WEB_ORIGIN} from '../src/platform/cors-origins.js';
import {configureApp} from '../src/platform/configure-app.js';
import {AuditEvent} from '../src/persistence/entities/audit-event.entity.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {ExternalIdentity} from '../src/persistence/entities/external-identity.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {RATE_LIMIT_POLICIES} from '../src/rate-limit/rate-limit.policies.js';
import {RATE_LIMIT_STORE} from '../src/rate-limit/rate-limit-store.js';
import {createAdminDataSource} from './admin-data-source.js';
import {runFakeOAuth} from './oauth-flow.js';
import {testRateLimitStore} from './rate-limit-test-store.js';

const password = 'Synthetic-Pass-1';
const mfaCode = '135791';
const FAILED = `${DEFAULT_LOCAL_WEB_ORIGIN}/login?reason=oauth_failed`;

type SecurityEventBody = {action: string; actorUserId: string; resourceType: string; resourceId: string | null};

describe('auth and sensitive-route rate limits (HTTP)', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let practice: Practice;
	let admin: User;
	let provider: User;
	let mfaUser: User;
	const suffix = randomUUID().slice(0, 8);
	const adminEmail = `rl.admin.${suffix}@synthetic.example`;
	const providerEmail = `rl.provider.${suffix}@synthetic.example`;
	const mfaEmail = `rl.mfa.${suffix}@synthetic.example`;
	let ipCounter = 0;
	let clockOffsetMs = 0;
	const clock: Clock = {now: () => new Date(Date.now() + clockOffsetMs)};

	/** A fresh client address per call so per-IP buckets never collide across tests. */
	function nextIp(): string {
		ipCounter += 1;
		return `198.51.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
	}

	function server() {
		return app.getHttpServer();
	}

	beforeAll(async () => {
		const catalog: MockIdpAccount[] = [
			{email: adminEmail, password, role: 'PRACTICE_ADMIN'},
			{email: providerEmail, password, role: 'PROVIDER'},
			{email: mfaEmail, password, role: 'NURSE', mfaRequired: true, mfaCode},
		];
		const moduleRef = await Test.createTestingModule({imports: [AppModule]})
			.overrideProvider(MOCK_IDP_USERS)
			.useValue(catalog)
			.overrideProvider(RATE_LIMIT_STORE)
			.useValue(testRateLimitStore)
			.overrideProvider(CLOCK)
			.useValue(clock)
			.compile();
		dataSource = await createAdminDataSource();
		app = moduleRef.createNestApplication();
		configureApp(app);
		(app.getHttpAdapter().getInstance() as {set(name: string, value: unknown): void}).set(
			'trust proxy',
			1,
		);
		await app.init();

		practice = await dataSource.getRepository(Practice).save({name: `Rate Limit ${suffix}`});
		admin = await dataSource.getRepository(User).save({email: adminEmail});
		provider = await dataSource.getRepository(User).save({email: providerEmail});
		mfaUser = await dataSource.getRepository(User).save({email: mfaEmail});
		await dataSource.getRepository(PracticeMembership).save([
			{practiceId: practice.id, userId: admin.id, role: 'PRACTICE_ADMIN'},
			{practiceId: practice.id, userId: provider.id, role: 'PROVIDER'},
			{practiceId: practice.id, userId: mfaUser.id, role: 'NURSE'},
		]);
	});

	afterAll(async () => {
		if (dataSource?.isInitialized) {
			const userIds = [admin, provider, mfaUser].filter(Boolean).map((user) => user.id);
			if (practice) {
				await dataSource.getRepository(AuditEvent).delete({practiceId: practice.id});
			}
			if (userIds.length > 0) {
				await dataSource.getRepository(ExternalIdentity).delete({userId: In(userIds)});
				await dataSource.getRepository(AuthSession).delete({userId: In(userIds)});
			}
			if (practice) {
				await dataSource.getRepository(PracticeMembership).delete({practiceId: practice.id});
			}
			if (userIds.length > 0) {
				await dataSource.getRepository(User).delete({id: In(userIds)});
			}
			if (practice) {
				await dataSource.getRepository(Practice).delete({id: practice.id});
			}
			await dataSource.destroy();
		}
		await app?.close();
	});

	beforeEach(() => {
		testRateLimitStore.reset();
		clockOffsetMs = 0;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	async function login(email: string, ip = nextIp()): Promise<string> {
		const response = await request(server())
			.post('/auth/login')
			.set('X-Forwarded-For', ip)
			.send({email, password})
			.expect(200);
		return response.body.accessToken as string;
	}

	async function rateLimitedEvents(): Promise<SecurityEventBody[]> {
		const token = await login(adminEmail);
		const listed = await request(server())
			.get('/admin/security-events')
			.query({action: 'auth.rate_limited'})
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		const events = listed.body.events as SecurityEventBody[];
		return events.filter((event) => event.action === 'auth.rate_limited');
	}

	function expect429(res: request.Response): void {
		expect(res.status).toBe(429);
		expect(res.body.error.code).toBe('RATE_LIMITED');
		expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
	}

	async function failLogin(email: string, ip: string): Promise<request.Response> {
		return request(server())
			.post('/auth/login')
			.set('X-Forwarded-For', ip)
			.send({email, password: 'wrong-password-1'});
	}

	it('holds the per-account limit while the real source IP rotates', async () => {
		const {limit} = RATE_LIMIT_POLICIES.loginAccountFailures;
		for (let i = 0; i < limit; i += 1) {
			expect((await failLogin(providerEmail, nextIp())).status).toBe(401);
		}
		const blocked = await request(server())
			.post('/auth/login')
			.set('X-Forwarded-For', nextIp())
			.send({email: providerEmail.toUpperCase(), password});
		expect429(blocked);
	});

	it('lets a legitimate user log in after a few failures, and successes cost no budget', async () => {
		const {limit} = RATE_LIMIT_POLICIES.loginAccountFailures;
		for (let i = 0; i < limit - 1; i += 1) {
			await failLogin(providerEmail, nextIp());
		}
		for (let i = 0; i < 3; i += 1) {
			await login(providerEmail);
		}
		expect((await failLogin(providerEmail, nextIp())).status).toBe(401);
		expect429(await failLogin(providerEmail, nextIp()));
	});

	it('recovers after the cooldown window with no permanent lockout', async () => {
		const {limit, windowMs} = RATE_LIMIT_POLICIES.loginAccountFailures;
		for (let i = 0; i < limit; i += 1) {
			await failLogin(providerEmail, nextIp());
		}
		expect429(await failLogin(providerEmail, nextIp()));
		clockOffsetMs += windowMs;
		await login(providerEmail);
	});

	it('returns the same 429 for unknown and known emails (no enumeration)', async () => {
		const {limit} = RATE_LIMIT_POLICIES.loginAccountFailures;
		const unknownEmail = `nobody.${suffix}@synthetic.example`;
		const before = await rateLimitedEvents();
		for (let i = 0; i < limit; i += 1) {
			await failLogin(unknownEmail, nextIp());
			await failLogin(providerEmail, nextIp());
		}
		const unknownBlocked = await failLogin(unknownEmail, nextIp());
		const knownBlocked = await failLogin(providerEmail, nextIp());
		expect429(unknownBlocked);
		expect429(knownBlocked);
		expect(unknownBlocked.body.error).toEqual(knownBlocked.body.error);
		const added = (await rateLimitedEvents()).length - before.length;
		expect(added).toBe(1);
	});

	it('limits login per device (client IP + normalized email) faster than the account limit', async () => {
		const {limit} = RATE_LIMIT_POLICIES.loginDevice;
		const email = `Rotating.${suffix}@Synthetic.Example`;
		for (let i = 0; i < limit; i += 1) {
			await request(server())
				.post('/auth/login')
				.set('X-Forwarded-For', '203.0.113.10')
				.send({email, password: 'wrong-password-1'})
				.expect(401);
		}
		const blocked = await request(server())
			.post('/auth/login')
			.set('X-Forwarded-For', '203.0.113.10')
			.send({email: email.toLowerCase(), password: 'wrong-password-1'});
		expect429(blocked);
		const otherIp = await request(server())
			.post('/auth/login')
			.set('X-Forwarded-For', '203.0.113.11')
			.send({email, password: 'wrong-password-1'});
		expect(otherIp.status).toBe(401);
	});

	it('holds the per-account limit when spoofed X-Forwarded-For hops rotate (TRUST_PROXY=1)', async () => {
		const {limit} = RATE_LIMIT_POLICIES.loginDevice;
		const email = `hops.${suffix}@synthetic.example`;
		for (let i = 0; i < limit; i += 1) {
			await request(server())
				.post('/auth/login')
				.set('X-Forwarded-For', `10.0.0.${i}, 203.0.113.20`)
				.send({email, password: 'wrong-password-1'})
				.expect(401);
		}
		expect429(
			await request(server())
				.post('/auth/login')
				.set('X-Forwarded-For', '10.9.9.9, 203.0.113.20')
				.send({email, password: 'wrong-password-1'}),
		);
	});

	it('holds the per-IP login limit across different emails', async () => {
		const {limit} = RATE_LIMIT_POLICIES.loginIp;
		for (let i = 0; i < limit; i += 1) {
			await request(server())
				.post('/auth/login')
				.set('X-Forwarded-For', '203.0.113.30')
				.send({email: `spray.${i}.${suffix}@synthetic.example`, password: 'wrong-password-1'})
				.expect(401);
		}
		expect429(
			await request(server())
				.post('/auth/login')
				.set('X-Forwarded-For', '203.0.113.30')
				.send({email: providerEmail, password}),
		);
	});

	it('blocks MFA verify well before the fixture code space is exhausted', async () => {
		const ip = nextIp();
		const challenge = await request(server())
			.post('/auth/login')
			.set('X-Forwarded-For', ip)
			.send({email: mfaEmail, password})
			.expect(200);
		const mfaToken = challenge.body.mfaToken as string;
		const {limit} = RATE_LIMIT_POLICIES.mfaVerify;
		for (let i = 0; i < limit; i += 1) {
			await request(server())
				.post('/auth/mfa/verify')
				.set('X-Forwarded-For', ip)
				.send({mfaToken, code: String(100000 + i)})
				.expect(401);
		}
		expect429(
			await request(server())
				.post('/auth/mfa/verify')
				.set('X-Forwarded-For', ip)
				.send({mfaToken, code: mfaCode}),
		);
	});

	it('returns 429 on refresh, OAuth start, and Fake authorize past the limit', async () => {
		const ip = nextIp();
		for (let i = 0; i < RATE_LIMIT_POLICIES.refresh.limit; i += 1) {
			await request(server())
				.post('/auth/refresh')
				.set('X-Forwarded-For', ip)
				.send({refreshToken: `bogus-${i}`})
				.expect(401);
		}
		expect429(
			await request(server())
				.post('/auth/refresh')
				.set('X-Forwarded-For', ip)
				.send({refreshToken: 'bogus'}),
		);

		for (let i = 0; i < RATE_LIMIT_POLICIES.oauthStart.limit; i += 1) {
			await request(server()).get('/auth/oauth/fake/start').set('X-Forwarded-For', ip).expect(302);
		}
		expect429(await request(server()).get('/auth/oauth/fake/start').set('X-Forwarded-For', ip));

		for (let i = 0; i < RATE_LIMIT_POLICIES.oauthFakeAuthorize.limit; i += 1) {
			await request(server()).get('/auth/oauth/fake/authorize').set('X-Forwarded-For', ip).expect(400);
		}
		expect429(await request(server()).get('/auth/oauth/fake/authorize').set('X-Forwarded-For', ip));
	});

	it('redirects a throttled OAuth callback to the generic failure page', async () => {
		const ip = nextIp();
		for (let i = 0; i < RATE_LIMIT_POLICIES.oauthCallback.limit; i += 1) {
			const res = await request(server())
				.get('/auth/oauth/fake/callback')
				.set('X-Forwarded-For', ip)
				.expect(302);
			expect(res.headers.location).toBe(FAILED);
		}
		const blocked = await request(server())
			.get('/auth/oauth/fake/callback')
			.set('X-Forwarded-For', ip)
			.expect(302);
		expect(blocked.headers.location).toBe(FAILED);
		expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
		expect(blocked.headers['set-cookie']).toBeUndefined();
	});

	it('still lets a normal login and a normal Fake OAuth flow succeed', async () => {
		await login(providerEmail);
		const result = await runFakeOAuth(app, providerEmail);
		expect(result.location.startsWith(`${DEFAULT_LOCAL_WEB_ORIGIN}/login/oauth/complete`)).toBe(true);
		expect(result.accessToken).toBeTruthy();
	});

	it('returns 429 on media-token, document download, and payment past the limit', async () => {
		const token = await login(providerEmail);
		const routes: Array<{name: string; limit: number; send: () => request.Test}> = [
			{
				name: 'media-token',
				limit: RATE_LIMIT_POLICIES.mediaToken.limit,
				send: () => request(server()).post(`/telehealth/sessions/${randomUUID()}/media-token`),
			},
			{
				name: 'document download',
				limit: RATE_LIMIT_POLICIES.documentDownload.limit,
				send: () =>
					request(server()).get(`/patients/${randomUUID()}/documents/${randomUUID()}/content`),
			},
			{
				name: 'payment',
				limit: RATE_LIMIT_POLICIES.payment.limit,
				send: () =>
					request(server()).post('/billing/payments').send({invoiceId: randomUUID(), method: 'card'}),
			},
		];
		for (const route of routes) {
			for (let i = 0; i < route.limit; i += 1) {
				const res = await route.send().set('Authorization', `Bearer ${token}`);
				expect(res.status, route.name).not.toBe(429);
			}
			const blocked = await route.send().set('Authorization', `Bearer ${token}`);
			expect(blocked.status, route.name).toBe(429);
			expect429(blocked);
		}
	});

	it('audits auth.rate_limited once per window for a known user, with no email, IP, or token', async () => {
		const before = await rateLimitedEvents();
		const ip = '203.0.113.40';
		for (let i = 0; i < RATE_LIMIT_POLICIES.loginDevice.limit + 3; i += 1) {
			await request(server())
				.post('/auth/login')
				.set('X-Forwarded-For', ip)
				.send({email: providerEmail, password: 'wrong-password-1'});
		}
		const unknownEmail = `ghost.${suffix}@synthetic.example`;
		for (let i = 0; i < RATE_LIMIT_POLICIES.loginDevice.limit + 2; i += 1) {
			await request(server())
				.post('/auth/login')
				.set('X-Forwarded-For', '203.0.113.41')
				.send({email: unknownEmail, password: 'wrong-password-1'});
		}

		const after = await rateLimitedEvents();
		const added = after.filter((event) => !before.some((prior) => JSON.stringify(prior) === JSON.stringify(event)));
		expect(added).toHaveLength(1);
		expect(added[0]).toMatchObject({
			action: 'auth.rate_limited',
			actorUserId: provider.id,
			resourceType: 'session',
			resourceId: null,
		});
		const payload = JSON.stringify(after);
		expect(payload).not.toContain(providerEmail);
		expect(payload).not.toContain(unknownEmail);
		expect(payload).not.toContain(ip);
		expect(payload).not.toContain('wrong-password-1');
	});

	it('fails closed with 503 on login when the store is unavailable', async () => {
		vi.spyOn(testRateLimitStore, 'increment').mockRejectedValue(new Error('store down'));
		const res = await request(server())
			.post('/auth/login')
			.set('X-Forwarded-For', nextIp())
			.send({email: providerEmail, password})
			.expect(503);
		expect(res.body.error.code).toBe('RATE_LIMIT_UNAVAILABLE');
	});
});
