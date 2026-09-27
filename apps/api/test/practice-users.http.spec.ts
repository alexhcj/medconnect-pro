import {randomUUID} from 'node:crypto';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {DataSource, In} from 'typeorm';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {MOCK_IDP_USERS, type MockIdpAccount} from '../src/identity/mock-idp.js';
import {configureApp} from '../src/platform/configure-app.js';
import {AuditEvent} from '../src/persistence/entities/audit-event.entity.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {createAdminDataSource} from './admin-data-source.js';

const password = 'Synthetic-Pass-1';

type PracticeUserBody = {
	id: string;
	email: string;
	role: string;
	practiceId: string;
	synthetic: boolean;
};

describe('practice user directory HTTP', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let practiceA: Practice;
	let practiceB: Practice;
	let admin: User;
	let superAdmin: User;
	let provider: User;
	let nurse: User;
	let receptionist: User;
	let portalUser: User;
	let foreignAdmin: User;
	const suffix = randomUUID().slice(0, 8);

	beforeAll(async () => {
		const adminEmail = `dir.admin.${suffix}@synthetic.example`;
		const superEmail = `dir.super.${suffix}@synthetic.example`;
		const providerEmail = `dir.provider.${suffix}@synthetic.example`;
		const nurseEmail = `dir.nurse.${suffix}@synthetic.example`;
		const receptionistEmail = `dir.receptionist.${suffix}@synthetic.example`;
		const portalEmail = `dir.portal.${suffix}@synthetic.example`;
		const foreignEmail = `dir.foreign.${suffix}@synthetic.example`;
		const catalog: MockIdpAccount[] = [
			{email: adminEmail, password, role: 'PRACTICE_ADMIN'},
			{email: superEmail, password, role: 'SUPER_ADMIN'},
			{email: providerEmail, password, role: 'PROVIDER'},
			{email: nurseEmail, password, role: 'NURSE'},
			{email: receptionistEmail, password, role: 'RECEPTIONIST'},
			{email: portalEmail, password, role: 'PATIENT'},
			{email: foreignEmail, password, role: 'PRACTICE_ADMIN'},
		];

		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(MOCK_IDP_USERS)
			.useValue(catalog)
			.compile();

		dataSource = await createAdminDataSource();
		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();

		practiceA = await dataSource.getRepository(Practice).save({
			name: `Directory North ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Directory South ${suffix}`,
		});
		admin = await dataSource.getRepository(User).save({email: adminEmail});
		superAdmin = await dataSource.getRepository(User).save({email: superEmail});
		provider = await dataSource.getRepository(User).save({email: providerEmail});
		nurse = await dataSource.getRepository(User).save({email: nurseEmail});
		receptionist = await dataSource.getRepository(User).save({email: receptionistEmail});
		portalUser = await dataSource.getRepository(User).save({email: portalEmail});
		foreignAdmin = await dataSource.getRepository(User).save({email: foreignEmail});
		await dataSource.getRepository(PracticeMembership).save([
			{practiceId: practiceA.id, userId: admin.id, role: 'PRACTICE_ADMIN'},
			{practiceId: practiceA.id, userId: superAdmin.id, role: 'SUPER_ADMIN'},
			{practiceId: practiceA.id, userId: provider.id, role: 'PROVIDER'},
			{practiceId: practiceA.id, userId: nurse.id, role: 'NURSE'},
			{practiceId: practiceA.id, userId: receptionist.id, role: 'RECEPTIONIST'},
			{practiceId: practiceA.id, userId: portalUser.id, role: 'PATIENT'},
			{practiceId: practiceB.id, userId: foreignAdmin.id, role: 'PRACTICE_ADMIN'},
		]);
	});

	afterAll(async () => {
		if (!dataSource?.isInitialized) {
			await app?.close();
			return;
		}
		const practiceIds = [practiceA, practiceB].filter(Boolean).map((item) => item.id);
		const users = await dataSource.getRepository(User).find({
			where: [
				{email: admin?.email},
				{email: superAdmin?.email},
				{email: provider?.email},
				{email: nurse?.email},
				{email: receptionist?.email},
				{email: portalUser?.email},
				{email: foreignAdmin?.email},
			],
		});
		const userIds = users.map((user) => user.id);
		if (userIds.length > 0) {
			await dataSource.getRepository(AuditEvent).delete({actorUserId: In(userIds)});
			await dataSource.getRepository(AuthSession).delete({userId: In(userIds)});
		}
		if (practiceIds.length > 0) {
			await dataSource.getRepository(PracticeMembership).delete({practiceId: In(practiceIds)});
		}
		if (userIds.length > 0) {
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

	async function login(email: string): Promise<string> {
		const response = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email, password})
			.expect(200);
		return response.body.accessToken as string;
	}

	it('rejects anonymous and non-admin access', async () => {
		const anonymous = await request(app.getHttpServer()).get('/admin/users').expect(401);
		expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

		for (const email of [provider.email, nurse.email, receptionist.email, portalUser.email]) {
			const token = await login(email);
			const denied = await request(app.getHttpServer())
				.get('/admin/users')
				.set('Authorization', `Bearer ${token}`)
				.expect(403);
			expect(denied.body.error.code).toBe('FORBIDDEN');
		}
	});

	it('lists session-tenant memberships for practice and super admins', async () => {
		const adminToken = await login(admin.email);
		const listed = await request(app.getHttpServer())
			.get('/admin/users')
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(200);

		const users = listed.body.users as PracticeUserBody[];
		expect(users.every((user) => user.practiceId === practiceA.id)).toBe(true);
		expect(users.every((user) => user.synthetic === true)).toBe(true);
		expect(users.map((user) => user.id).sort()).toEqual(
			[admin.id, superAdmin.id, provider.id, nurse.id, receptionist.id, portalUser.id].sort(),
		);
		expect(users.find((user) => user.id === admin.id)).toMatchObject({
			email: admin.email,
			role: 'PRACTICE_ADMIN',
			practiceId: practiceA.id,
			synthetic: true,
		});
		expect(users.find((user) => user.id === provider.id)).toMatchObject({
			email: provider.email,
			role: 'PROVIDER',
		});
		expect(users.some((user) => user.id === foreignAdmin.id)).toBe(false);
		expect(users.some((user) => user.email === foreignAdmin.email)).toBe(false);

		const payload = JSON.stringify(listed.body);
		expect(payload).not.toContain(password);
		expect(payload).not.toMatch(/mfaToken|refreshToken|accessTokenHash|mfaCode/);
		expect(listed.body).not.toHaveProperty('password');

		const mismatch = await request(app.getHttpServer())
			.get('/admin/users')
			.query({practiceId: practiceB.id})
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');
		expect(JSON.stringify(mismatch.body)).not.toContain(foreignAdmin.email);

		const unknown = await request(app.getHttpServer())
			.get('/admin/users')
			.query({practiceId: randomUUID()})
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(403);
		expect(unknown.body.error.code).toBe('FORBIDDEN');

		const superToken = await login(superAdmin.email);
		const superListed = await request(app.getHttpServer())
			.get('/admin/users')
			.set('Authorization', `Bearer ${superToken}`)
			.expect(200);
		const superUsers = superListed.body.users as PracticeUserBody[];
		expect(superUsers.every((user) => user.practiceId === practiceA.id)).toBe(true);
		expect(superUsers.some((user) => user.id === foreignAdmin.id)).toBe(false);
	});
});
