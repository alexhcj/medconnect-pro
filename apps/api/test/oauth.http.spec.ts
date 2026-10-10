import {randomUUID} from 'node:crypto';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {DataSource, In} from 'typeorm';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {MOCK_IDP_USERS, type MockIdpAccount} from '../src/identity/mock-idp.js';
import {FakeOidcAdapter, fakeSubjectFor} from '../src/identity/oidc/fake-oidc.adapter.js';
import {UnavailableOidcAdapter} from '../src/identity/oidc/oidc-provider.factory.js';
import {OIDC_PROVIDER_PORT} from '../src/identity/oidc/oidc-provider.port.js';
import {ACCESS_COOKIE_NAME} from '../src/identity/session-cookies.js';
import {hashToken} from '../src/identity/token.js';
import {AuditEvent} from '../src/persistence/entities/audit-event.entity.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {ExternalIdentity} from '../src/persistence/entities/external-identity.entity.js';
import {OAuthFlowState} from '../src/persistence/entities/oauth-flow-state.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {configureApp} from '../src/platform/configure-app.js';
import {DEFAULT_LOCAL_WEB_ORIGIN} from '../src/platform/cors-origins.js';
import type {PracticeRole} from '../src/tenancy/practice-role.js';
import {createAdminDataSource} from './admin-data-source.js';
import {
	authorizeFakeOAuth,
	completeFakeOAuth,
	runFakeOAuth,
	startFakeOAuth,
} from './oauth-flow.js';
import {RATE_LIMIT_STORE} from '../src/rate-limit/rate-limit-store.js';
import {testRateLimitStore} from './rate-limit-test-store.js';

const password = 'Synthetic-Pass-1';
const FAILED = `${DEFAULT_LOCAL_WEB_ORIGIN}/login?reason=oauth_failed`;
const COMPLETE = `${DEFAULT_LOCAL_WEB_ORIGIN}/login/oauth/complete`;

describe('OAuth HTTP (Fake OIDC)', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let fake: FakeOidcAdapter;
	let practiceA: Practice;
	let practiceB: Practice;
	const suffix = randomUUID().slice(0, 8);
	const userIds: string[] = [];
	const catalog: MockIdpAccount[] = [];

	async function provision(label: string, role: PracticeRole = 'NURSE'): Promise<User> {
		const email = `oauth.${label}.${suffix}@synthetic.example`;
		const user = await dataSource.getRepository(User).save({email});
		userIds.push(user.id);
		await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceA.id,
			userId: user.id,
			role,
		});
		return user;
	}

	function stateFrom(location: string): string {
		return new URL(location, 'http://api.local').searchParams.get('state') ?? '';
	}

	async function auditActions(userId: string): Promise<string[]> {
		const rows = await dataSource
			.getRepository(AuditEvent)
			.find({where: {actorUserId: userId}, order: {createdAt: 'ASC'}});
		return rows.map((row) => row.action);
	}

	function expectNoSession(setCookies: string[]): void {
		expect(setCookies.some((cookie) => cookie.startsWith(`${ACCESS_COOKIE_NAME}=`))).toBe(false);
	}

	beforeAll(async () => {
		catalog.push({email: `oauth.password.${suffix}@synthetic.example`, password, role: 'NURSE'});
		const moduleRef = await Test.createTestingModule({imports: [AppModule]})
			.overrideProvider(MOCK_IDP_USERS)
			.useValue(catalog)
			.overrideProvider(RATE_LIMIT_STORE)
			.useValue(testRateLimitStore)
			.compile();
		dataSource = await createAdminDataSource();
		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();
		const provider = app.get(OIDC_PROVIDER_PORT);
		if (!(provider instanceof FakeOidcAdapter)) {
			throw new Error('Expected the Fake OIDC adapter under APP_ENV=local');
		}
		fake = provider;
		practiceA = await dataSource.getRepository(Practice).save({name: `OAuth North ${suffix}`});
		practiceB = await dataSource.getRepository(Practice).save({name: `OAuth South ${suffix}`});
	});

	afterAll(async () => {
		if (dataSource?.isInitialized) {
			const practiceIds = [practiceA, practiceB].filter(Boolean).map((practice) => practice.id);
			await dataSource.getRepository(AuditEvent).delete({practiceId: In(practiceIds)});
			if (userIds.length > 0) {
				await dataSource.getRepository(AuthSession).delete({userId: In(userIds)});
				await dataSource.getRepository(ExternalIdentity).delete({userId: In(userIds)});
				await dataSource.getRepository(PracticeMembership).delete({userId: In(userIds)});
				await dataSource.getRepository(User).delete({id: In(userIds)});
			}
			await dataSource.getRepository(Practice).delete({id: In(practiceIds)});
			await dataSource.destroy();
		}
		await app?.close();
	});

	it('Fake happy path issues the password-login session and links the identity once', async () => {
		const nurse = await provision('happy');
		const result = await runFakeOAuth(app, nurse.email);
		expect(result.location).toBe(`${COMPLETE}?returnTo=%2Fdashboard`);
		expect(result.accessToken).toEqual(expect.any(String));
		expect(result.refreshToken).toEqual(expect.any(String));

		const cookie = `${ACCESS_COOKIE_NAME}=${encodeURIComponent(result.accessToken ?? '')}`;
		const session = await request(app.getHttpServer())
			.get('/auth/session')
			.set('Cookie', cookie)
			.expect(200);
		expect(session.body).toEqual({
			userId: nurse.id,
			email: nurse.email,
			role: 'NURSE',
			practiceId: practiceA.id,
			expiresIn: expect.any(Number),
		});
		expect(JSON.stringify(session.body)).not.toContain(result.accessToken);

		await request(app.getHttpServer()).get('/patients').set('Cookie', cookie).expect(200);
		await request(app.getHttpServer())
			.get(`/patients?practiceId=${practiceB.id}`)
			.set('Cookie', cookie)
			.expect(403);
		await request(app.getHttpServer()).get('/admin/users').set('Cookie', cookie).expect(403);

		const bearer = await request(app.getHttpServer())
			.get('/auth/session')
			.set('Authorization', `Bearer ${result.accessToken}`)
			.expect(200);
		expect(bearer.body.role).toBe('NURSE');

		const again = await runFakeOAuth(app, nurse.email);
		expect(again.accessToken).toEqual(expect.any(String));
		const links = await dataSource.getRepository(ExternalIdentity).find({where: {userId: nurse.id}});
		expect(links).toHaveLength(1);
		expect(links[0]).toMatchObject({provider: 'fake', subject: fakeSubjectFor(nurse.email)});
		const actions = await auditActions(nurse.id);
		expect(actions.filter((action) => action === 'auth.oauth.linked')).toHaveLength(1);
		expect(actions.filter((action) => action === 'auth.oauth.succeeded')).toHaveLength(2);
	});

	it('GET /auth/session requires a session', async () => {
		await request(app.getHttpServer()).get('/auth/session').expect(401);
	});

	it('honors an allowlisted returnTo', async () => {
		const nurse = await provision('return');
		const result = await runFakeOAuth(app, nurse.email, '/dashboard/patients');
		expect(result.location).toBe(`${COMPLETE}?returnTo=%2Fdashboard%2Fpatients`);
	});

	it.each([
		'https://evil.example/dashboard',
		'//evil.example/dashboard',
		'/\\evil.example',
		'/login',
		'/dashboard/../admin',
		'dashboard',
	])('rejects returnTo %s without creating flow state', async (returnTo) => {
		const before = await dataSource.getRepository(OAuthFlowState).count();
		const response = await request(app.getHttpServer())
			.get(`/auth/oauth/fake/start?returnTo=${encodeURIComponent(returnTo)}`)
			.expect(400);
		expect(response.headers.location).toBeUndefined();
		expect(await dataSource.getRepository(OAuthFlowState).count()).toBeLessThanOrEqual(before);
	});

	it('rejects an unknown provider', async () => {
		await request(app.getHttpServer()).get('/auth/oauth/github/start').expect(400);
	});

	it('fails without a session when state is missing or unknown', async () => {
		for (const path of [
			'/auth/oauth/fake/callback?code=abc',
			`/auth/oauth/fake/callback?code=abc&state=${randomUUID()}`,
		]) {
			const result = await completeFakeOAuth(app, path);
			expect(result.location).toBe(FAILED);
			expectNoSession(result.setCookies);
		}
	});

	it('fails without a session when state is replayed', async () => {
		const nurse = await provision('replay');
		const authorize = await startFakeOAuth(app);
		const callback = await authorizeFakeOAuth(app, authorize, nurse.email);
		const first = await completeFakeOAuth(app, callback);
		expect(first.location).toContain(COMPLETE);
		const replay = await completeFakeOAuth(app, callback);
		expect(replay.location).toBe(FAILED);
		expectNoSession(replay.setCookies);
	});

	it('fails without a session when state is expired', async () => {
		const nurse = await provision('expired');
		const authorize = await startFakeOAuth(app);
		await dataSource
			.getRepository(OAuthFlowState)
			.update({stateHash: hashToken(stateFrom(authorize))}, {expiresAt: new Date(Date.now() - 1000)});
		const callback = await authorizeFakeOAuth(app, authorize, nurse.email);
		const result = await completeFakeOAuth(app, callback);
		expect(result.location).toBe(FAILED);
		expectNoSession(result.setCookies);
	});

	it('fails when the PKCE verifier does not match', async () => {
		const nurse = await provision('pkce');
		const authorize = await startFakeOAuth(app);
		await dataSource
			.getRepository(OAuthFlowState)
			.update({stateHash: hashToken(stateFrom(authorize))}, {codeVerifier: 'x'.repeat(64)});
		const callback = await authorizeFakeOAuth(app, authorize, nurse.email);
		const result = await completeFakeOAuth(app, callback);
		expect(result.location).toBe(FAILED);
		expectNoSession(result.setCookies);
	});

	it.each([
		['nonce', {nonce: 'wrong-nonce'}],
		['aud', {aud: 'someone-else'}],
		['iss', {iss: 'https://evil.example'}],
		['exp', {exp: Math.floor(Date.now() / 1000) - 3600}],
		['email_verified', {email_verified: false}],
	])('fails on a bad %s claim', async (label, claims) => {
		const nurse = await provision(`claim-${label}`);
		const authorize = await startFakeOAuth(app);
		const callback = await authorizeFakeOAuth(app, authorize, nurse.email);
		fake.overrideNextClaims(claims);
		const result = await completeFakeOAuth(app, callback);
		expect(result.location).toBe(FAILED);
		expectNoSession(result.setCookies);
		expect(await dataSource.getRepository(ExternalIdentity).count({where: {userId: nurse.id}})).toBe(0);
	});

	it('rejects an unknown email without creating a user', async () => {
		const email = `oauth.unknown.${suffix}@synthetic.example`;
		const result = await runFakeOAuth(app, email);
		expect(result.location).toBe(FAILED);
		expectNoSession(result.setCookies);
		expect(await dataSource.getRepository(User).count({where: {email}})).toBe(0);
	});

	it('rejects a sub linked to another user and audits identity_mismatch', async () => {
		const owner = await provision('owner');
		const other = await provision('other');
		expect((await runFakeOAuth(app, owner.email)).accessToken).toBeDefined();
		const authorize = await startFakeOAuth(app);
		const callback = await authorizeFakeOAuth(app, authorize, other.email);
		fake.overrideNextClaims({sub: fakeSubjectFor(owner.email)});
		const result = await completeFakeOAuth(app, callback);
		expect(result.location).toBe(FAILED);
		expectNoSession(result.setCookies);
		expect(await auditActions(owner.id)).toContain('auth.oauth.identity_mismatch');
		expect(await dataSource.getRepository(ExternalIdentity).count({where: {userId: other.id}})).toBe(0);
	});

	it('rejects a different sub for an already-linked user and audits identity_mismatch', async () => {
		const linked = await provision('relink');
		expect((await runFakeOAuth(app, linked.email)).accessToken).toBeDefined();
		const authorize = await startFakeOAuth(app);
		const callback = await authorizeFakeOAuth(app, authorize, linked.email);
		fake.overrideNextClaims({sub: `fake-other-${suffix}`});
		const result = await completeFakeOAuth(app, callback);
		expect(result.location).toBe(FAILED);
		expectNoSession(result.setCookies);
		expect(await auditActions(linked.id)).toContain('auth.oauth.identity_mismatch');
		const links = await dataSource.getRepository(ExternalIdentity).find({where: {userId: linked.id}});
		expect(links).toHaveLength(1);
		expect(links[0]?.subject).toBe(fakeSubjectFor(linked.email));
	});

	it('keeps browser-facing errors generic', async () => {
		const authorize = await startFakeOAuth(app);
		const state = stateFrom(authorize);
		const result = await completeFakeOAuth(
			app,
			`/auth/oauth/fake/callback?state=${state}&error=access_denied&error_description=provider-secret-detail`,
		);
		expect(result.location).toBe(FAILED);
		expect(result.location).not.toContain('provider-secret-detail');
		expect(result.location).not.toContain('access_denied');
		expectNoSession(result.setCookies);
	});

	it('ignores IdP role and practice claims', async () => {
		const receptionist = await provision('claims', 'RECEPTIONIST');
		const authorize = await startFakeOAuth(app);
		const callback = await authorizeFakeOAuth(app, authorize, receptionist.email);
		fake.overrideNextClaims({role: 'SUPER_ADMIN', practiceId: practiceB.id, groups: ['admins']});
		const result = await completeFakeOAuth(app, callback);
		const session = await request(app.getHttpServer())
			.get('/auth/session')
			.set('Authorization', `Bearer ${result.accessToken}`)
			.expect(200);
		expect(session.body).toMatchObject({role: 'RECEPTIONIST', practiceId: practiceA.id});
	});

	it('fails when the user has no single resolvable membership', async () => {
		const multi = await provision('multi');
		await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceB.id,
			userId: multi.id,
			role: 'NURSE',
		});
		const result = await runFakeOAuth(app, multi.email);
		expect(result.location).toBe(FAILED);
		expectNoSession(result.setCookies);
		expect(await auditActions(multi.id)).toContain('auth.oauth.failed');
	});

	it('password login still issues sessions alongside OAuth', async () => {
		const passwordUser = await dataSource
			.getRepository(User)
			.save({email: catalog[0]?.email ?? ''});
		userIds.push(passwordUser.id);
		await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceA.id,
			userId: passwordUser.id,
			role: 'NURSE',
		});
		const response = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email: passwordUser.email, password})
			.expect(200);
		const session = await request(app.getHttpServer())
			.get('/auth/session')
			.set('Authorization', `Bearer ${response.body.accessToken}`)
			.expect(200);
		expect(session.body.userId).toBe(passwordUser.id);
	});
});

describe('OAuth HTTP (unconfigured hosted provider)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({imports: [AppModule]})
			.overrideProvider(OIDC_PROVIDER_PORT)
			.useValue(new UnavailableOidcAdapter('google'))
			.overrideProvider(RATE_LIMIT_STORE)
			.useValue(testRateLimitStore)
			.compile();
		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();
	});

	afterAll(async () => {
		await app?.close();
	});

	it('start returns a labeled 503 instead of crashing', async () => {
		const response = await request(app.getHttpServer()).get('/auth/oauth/google/start').expect(503);
		expect(response.body.error.code).toBe('OAUTH_UNAVAILABLE');
	});

	it('does not expose the Fake authorize endpoint', async () => {
		await request(app.getHttpServer())
			.get('/auth/oauth/fake/authorize?state=a&code_challenge=b&nonce=c')
			.expect(404);
	});

	it('callback fails generically', async () => {
		const response = await request(app.getHttpServer())
			.get('/auth/oauth/google/callback?code=a&state=b')
			.expect(302);
		expect(response.headers.location).toBe(FAILED);
	});
});
