import {randomUUID} from 'node:crypto';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {DataSource, In} from 'typeorm';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {MOCK_IDP_USERS, type MockIdpAccount} from '../src/identity/mock-idp.js';
import {
	ACCESS_COOKIE_NAME,
	MFA_COOKIE_NAME,
	REFRESH_COOKIE_NAME,
} from '../src/identity/session-cookies.js';
import {configureApp} from '../src/platform/configure-app.js';
import {DEFAULT_LOCAL_WEB_ORIGIN} from '../src/platform/cors-origins.js';
import {PracticeModule} from '../src/practice/practice.module.js';
import {TenancyModule} from '../src/tenancy/tenant.module.js';
import {PatientAssignment} from '../src/persistence/entities/patient-assignment.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {AuditEvent} from '../src/persistence/entities/audit-event.entity.js';
import {AuthorizationProbeController} from './authorization-probe.controller.js';
import {createAdminDataSource} from './admin-data-source.js';
import {syntheticPatientColumns} from './synthetic-patient.js';
import {RATE_LIMIT_STORE} from '../src/rate-limit/rate-limit-store.js';
import {testRateLimitStore} from './rate-limit-test-store.js';

const password = 'Synthetic-Pass-1';
const mfaCode = '135791';

describe('identity HTTP', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let practiceA: Practice;
	let practiceB: Practice;
	let nurse: User;
	let admin: User;
	let mfaUser: User;
	let patientA: Patient;
	let patientB: Patient;

	beforeAll(async () => {
		const suffix = randomUUID();
		const nurseEmail = `nurse.${suffix}@synthetic.example`;
		const adminEmail = `admin.${suffix}@synthetic.example`;
		const mfaEmail = `mfa.${suffix}@synthetic.example`;
		const catalog: MockIdpAccount[] = [
			{email: nurseEmail, password, role: 'NURSE'},
			{email: adminEmail, password, role: 'PRACTICE_ADMIN'},
			{email: mfaEmail, password, role: 'NURSE', mfaRequired: true, mfaCode},
		];

		const moduleRef = await Test.createTestingModule({
			imports: [AppModule, PracticeModule, TenancyModule],
			controllers: [AuthorizationProbeController],
		})
			.overrideProvider(MOCK_IDP_USERS)
			.useValue(catalog)
			.overrideProvider(RATE_LIMIT_STORE)
			.useValue(testRateLimitStore)
			.compile();

		dataSource = await createAdminDataSource();
		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();

		practiceA = await dataSource.getRepository(Practice).save({
			name: `North Synthetic ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `South Synthetic ${suffix}`,
		});
		nurse = await dataSource.getRepository(User).save({email: nurseEmail});
		admin = await dataSource.getRepository(User).save({email: adminEmail});
		mfaUser = await dataSource.getRepository(User).save({email: mfaEmail});
		await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceA.id,
			userId: nurse.id,
			role: 'NURSE',
		});
		await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceA.id,
			userId: admin.id,
			role: 'PRACTICE_ADMIN',
		});
		await dataSource.getRepository(PracticeMembership).save({
			practiceId: practiceA.id,
			userId: mfaUser.id,
			role: 'NURSE',
		});
		patientA = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(nurse.id),
		});
		patientB = await dataSource.getRepository(Patient).save({
			practiceId: practiceB.id,
			...syntheticPatientColumns(nurse.id, {
				firstName: 'Casey',
				lastName: `Ramirez${suffix.slice(0, 8)}`,
				email: `casey.${suffix}@synthetic.example`,
			}),
		});
	});

	afterAll(async () => {
		if (!dataSource?.isInitialized) {
			await app?.close();
			return;
		}
		const userIds = [nurse, admin, mfaUser].filter(Boolean).map((user) => user.id);
		const patientIds = [patientA, patientB].filter(Boolean).map((patient) => patient.id);
		const practiceIds = [practiceA, practiceB].filter(Boolean).map((practice) => practice.id);
		if (practiceIds.length > 0) {
			await dataSource.getRepository(AuditEvent).delete({practiceId: In(practiceIds)});
		}
		if (patientIds.length > 0) {
			await dataSource.getRepository(PatientAssignment).delete({patientId: In(patientIds)});
			await dataSource.getRepository(Patient).delete({id: In(patientIds)});
		}
		if (userIds.length > 0) {
			await dataSource.getRepository(AuthSession).delete({userId: In(userIds)});
			await dataSource.getRepository(PracticeMembership).delete({userId: In(userIds)});
			await dataSource.getRepository(User).delete({id: In(userIds)});
		}
		if (practiceIds.length > 0) {
			await dataSource.getRepository(Practice).delete({id: In(practiceIds)});
		}
		await app?.close();
		if (dataSource?.isInitialized) {
			await dataSource.destroy();
		}
	});

	async function login(email: string): Promise<{accessToken: string; refreshToken: string}> {
		const response = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email, password})
			.expect(200);
		expect(response.body.tokenType).toBe('Bearer');
		expect(response.body.accessToken).toEqual(expect.any(String));
		expect(response.body.refreshToken).toEqual(expect.any(String));
		expect(response.body).not.toHaveProperty('password');
		return response.body as {accessToken: string; refreshToken: string};
	}

	it('keeps health and readiness unauthenticated', async () => {
		await request(app.getHttpServer()).get('/health').expect(200);
		await request(app.getHttpServer()).get('/ready').expect(200);
	});

	it('rejects anonymous access to logout and the protected probe', async () => {
		const logout = await request(app.getHttpServer()).post('/auth/logout').expect(401);
		expect(logout.body.error.code).toBe('UNAUTHENTICATED');
		const probe = await request(app.getHttpServer()).get('/__test/authz').expect(401);
		expect(probe.body.error.code).toBe('UNAUTHENTICATED');
	});

	it('resolves tenant from the membership and rejects a different practice id', async () => {
		const tokens = await login(nurse.email);
		const scope = await request(app.getHttpServer())
			.get('/__test/authz')
			.set('Authorization', `Bearer ${tokens.accessToken}`)
			.expect(200);
		expect(scope.body).toEqual({practiceId: practiceA.id, role: 'NURSE'});

		const mismatch = await request(app.getHttpServer())
			.get('/__test/authz')
			.query({practiceId: practiceB.id})
			.set('Authorization', `Bearer ${tokens.accessToken}`)
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');
		expect(JSON.stringify(mismatch.body)).not.toContain(practiceB.id);

		const again = await request(app.getHttpServer())
			.get('/__test/authz')
			.set('Authorization', `Bearer ${tokens.accessToken}`)
			.expect(200);
		expect(again.body.practiceId).toBe(practiceA.id);

		const loginMismatch = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email: nurse.email, password, practiceId: practiceB.id})
			.expect(403);
		expect(loginMismatch.body.error.code).toBe('FORBIDDEN');
		expect(JSON.stringify(loginMismatch.body)).not.toContain(practiceB.id);
	});

	it('denies a role that lacks the required permission', async () => {
		const nurseTokens = await login(nurse.email);
		const denied = await request(app.getHttpServer())
			.get('/__test/authz/admin')
			.set('Authorization', `Bearer ${nurseTokens.accessToken}`)
			.expect(403);
		expect(denied.body.error).toMatchObject({
			code: 'FORBIDDEN',
			message: 'You do not have permission to perform this action',
		});

		const adminTokens = await login(admin.email);
		await request(app.getHttpServer())
			.get('/__test/authz/admin')
			.set('Authorization', `Bearer ${adminTokens.accessToken}`)
			.expect(200);
	});

	it('does not reveal a patient that belongs to another practice', async () => {
		const tokens = await login(nurse.email);
		const hidden = await request(app.getHttpServer())
			.get(`/__test/authz/patients/${patientB.id}`)
			.set('Authorization', `Bearer ${tokens.accessToken}`)
			.expect(404);
		expect(hidden.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(hidden.body)).not.toContain(patientB.lastName);
		expect(JSON.stringify(hidden.body)).not.toContain(practiceB.id);

		const visible = await request(app.getHttpServer())
			.get(`/__test/authz/patients/${patientA.id}`)
			.set('Authorization', `Bearer ${tokens.accessToken}`)
			.expect(200);
		expect(visible.body).toEqual({id: patientA.id});
	});

	it('rotates refresh tokens and rejects reuse', async () => {
		const first = await login(admin.email);
		const refreshed = await request(app.getHttpServer())
			.post('/auth/refresh')
			.send({refreshToken: first.refreshToken})
			.expect(200);
		await request(app.getHttpServer())
			.get('/__test/authz')
			.set('Authorization', `Bearer ${refreshed.body.accessToken}`)
			.expect(200);
		const reused = await request(app.getHttpServer())
			.post('/auth/refresh')
			.send({refreshToken: first.refreshToken})
			.expect(401);
		expect(reused.body.error.code).toBe('UNAUTHENTICATED');
		expect(reused.headers['cache-control']).toBe('no-store');
		expect(refreshed.headers['cache-control']).toBe('no-store');
		await request(app.getHttpServer())
			.get('/__test/authz')
			.set('Authorization', `Bearer ${refreshed.body.accessToken}`)
			.expect(401);
	});

	it('revokes every session on logout-all', async () => {
		const first = await login(admin.email);
		const second = await login(admin.email);
		await request(app.getHttpServer())
			.post('/auth/logout-all')
			.set('Authorization', `Bearer ${first.accessToken}`)
			.expect(204);
		await request(app.getHttpServer())
			.get('/__test/authz')
			.set('Authorization', `Bearer ${first.accessToken}`)
			.expect(401);
		await request(app.getHttpServer())
			.get('/__test/authz')
			.set('Authorization', `Bearer ${second.accessToken}`)
			.expect(401);
	});

	it('completes mock MFA before issuing an access token', async () => {
		const challenge = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email: mfaUser.email, password})
			.expect(200);
		expect(challenge.body.mfaRequired).toBe(true);
		expect(challenge.body.accessToken).toBeUndefined();

		const rejected = await request(app.getHttpServer())
			.post('/auth/mfa/verify')
			.send({mfaToken: challenge.body.mfaToken, code: '000000'})
			.expect(401);
		expect(rejected.body.error.code).toBe('UNAUTHENTICATED');

		const verified = await request(app.getHttpServer())
			.post('/auth/mfa/verify')
			.send({mfaToken: challenge.body.mfaToken, code: mfaCode})
			.expect(200);
		await request(app.getHttpServer())
			.get('/__test/authz')
			.set('Authorization', `Bearer ${verified.body.accessToken}`)
			.expect(200);
	});

	it('allows credentialed CORS from the local web origin', async () => {
		const response = await request(app.getHttpServer())
			.options('/auth/login')
			.set('Origin', DEFAULT_LOCAL_WEB_ORIGIN)
			.set('Access-Control-Request-Method', 'POST')
			.set('Access-Control-Request-Headers', 'content-type')
			.expect(204);
		expect(response.headers['access-control-allow-credentials']).toBe('true');
		expect(response.headers['access-control-allow-origin']).toBe(DEFAULT_LOCAL_WEB_ORIGIN);
	});

	it('authenticates from HttpOnly cookies and clears them on logout', async () => {
		const agent = request.agent(app.getHttpServer());
		const loggedIn = await agent.post('/auth/login').send({email: nurse.email, password}).expect(200);
		expectLocalSessionCookies(loggedIn);
		const scope = await agent.get('/__test/authz').expect(200);
		expect(scope.body).toEqual({practiceId: practiceA.id, role: 'NURSE'});
		const loggedOut = await agent.post('/auth/logout').send({}).expect(204);
		expectClearedSessionCookies(loggedOut);
		await agent.get('/__test/authz').expect(401);
	});

	it('rotates refresh from the session cookie and still revokes reuse', async () => {
		const agent = request.agent(app.getHttpServer());
		const first = await agent.post('/auth/login').send({email: admin.email, password}).expect(200);
		const rotated = await agent.post('/auth/refresh').send({}).expect(200);
		expectLocalSessionCookies(rotated);
		await agent.get('/__test/authz').expect(200);
		const reused = await request(app.getHttpServer())
			.post('/auth/refresh')
			.send({refreshToken: first.body.refreshToken})
			.expect(401);
		expect(reused.body.error.code).toBe('UNAUTHENTICATED');
		await agent.get('/__test/authz').expect(401);
	});

	it('completes mock MFA from the challenge cookie', async () => {
		const agent = request.agent(app.getHttpServer());
		const challenge = await agent.post('/auth/login').send({email: mfaUser.email, password}).expect(200);
		expect(challenge.body.mfaRequired).toBe(true);
		expect(cookieNamed(setCookieHeaders(challenge), MFA_COOKIE_NAME)).toMatch(/HttpOnly/i);
		const verified = await agent.post('/auth/mfa/verify').send({code: mfaCode}).expect(200);
		expectLocalSessionCookies(verified);
		await agent.get('/__test/authz').expect(200);
	});

	it('clears cookies on logout-all and revokes other sessions', async () => {
		const agent = request.agent(app.getHttpServer());
		await agent.post('/auth/login').send({email: admin.email, password}).expect(200);
		const second = await login(admin.email);
		const loggedOut = await agent.post('/auth/logout-all').send({}).expect(204);
		expectClearedSessionCookies(loggedOut);
		await agent.get('/__test/authz').expect(401);
		await request(app.getHttpServer())
			.get('/__test/authz')
			.set('Authorization', `Bearer ${second.accessToken}`)
			.expect(401);
	});
});

function setCookieHeaders(response: {headers: Record<string, unknown>}): string[] {
	const header = response.headers['set-cookie'];
	if (!header) {
		return [];
	}
	return Array.isArray(header) ? header.map(String) : [String(header)];
}

function cookieNamed(headers: string[], name: string): string | undefined {
	return headers.find((value) => value.startsWith(`${name}=`));
}

function expectLocalSessionCookies(response: {headers: Record<string, unknown>}): void {
	const cookies = setCookieHeaders(response);
	const access = cookieNamed(cookies, ACCESS_COOKIE_NAME);
	const refresh = cookieNamed(cookies, REFRESH_COOKIE_NAME);
	expect(access).toBeDefined();
	expect(refresh).toBeDefined();
	expect(access).toMatch(/HttpOnly/i);
	expect(refresh).toMatch(/HttpOnly/i);
	expect(access).toMatch(/SameSite=Lax/i);
	expect(access).not.toMatch(/;\s*Secure(?:;|$)/i);
	expect(refresh).not.toMatch(/;\s*Secure(?:;|$)/i);
}

function expectClearedSessionCookies(response: {headers: Record<string, unknown>}): void {
	const cookies = setCookieHeaders(response);
	const access = cookieNamed(cookies, ACCESS_COOKIE_NAME);
	const refresh = cookieNamed(cookies, REFRESH_COOKIE_NAME);
	expect(access).toBeDefined();
	expect(refresh).toBeDefined();
	expect(access).toMatch(/Max-Age=0|Expires=/i);
	expect(refresh).toMatch(/Max-Age=0|Expires=/i);
}
