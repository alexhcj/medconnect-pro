import {randomUUID} from 'node:crypto';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {DataSource, In} from 'typeorm';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {MOCK_IDP_USERS, type MockIdpAccount} from '../src/identity/mock-idp.js';
import {configureApp} from '../src/platform/configure-app.js';
import {PracticeModule} from '../src/practice/practice.module.js';
import {TenancyModule} from '../src/tenancy/tenant.module.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {AuthorizationProbeController} from './authorization-probe.controller.js';

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
			.compile();

		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();
		dataSource = app.get(DataSource);
		await dataSource.runMigrations();

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
			firstName: 'Avery',
			lastName: 'Quinn',
			synthetic: true,
		});
		patientB = await dataSource.getRepository(Patient).save({
			practiceId: practiceB.id,
			firstName: 'Casey',
			lastName: `Ramirez${suffix.slice(0, 8)}`,
			synthetic: true,
		});
	});

	afterAll(async () => {
		if (!dataSource?.isInitialized) {
			await app?.close();
			return;
		}
		const userIds = [nurse, admin, mfaUser].filter(Boolean).map((user) => user.id);
		if (userIds.length > 0) {
			await dataSource.getRepository(AuthSession).delete({userId: In(userIds)});
			await dataSource.getRepository(PracticeMembership).delete({userId: In(userIds)});
			await dataSource.getRepository(User).delete({id: In(userIds)});
		}
		const patientIds = [patientA, patientB].filter(Boolean).map((patient) => patient.id);
		if (patientIds.length > 0) {
			await dataSource.getRepository(Patient).delete({id: In(patientIds)});
		}
		const practiceIds = [practiceA, practiceB].filter(Boolean).map((practice) => practice.id);
		if (practiceIds.length > 0) {
			await dataSource.getRepository(Practice).delete({id: In(practiceIds)});
		}
		await app?.close();
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
});
