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

type SecurityEventBody = {
	id: string;
	practiceId: string;
	actorUserId: string;
	action: string;
	resourceType: string;
	resourceId: string | null;
	correlationId: string;
	createdAt: string;
};

describe('security-events HTTP', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let practiceA: Practice;
	let practiceB: Practice;
	let admin: User;
	let provider: User;
	let nurse: User;
	let receptionist: User;
	let portalUser: User;
	let foreignAdmin: User;
	const suffix = randomUUID().slice(0, 8);

	beforeAll(async () => {
		const adminEmail = `security.admin.${suffix}@synthetic.example`;
		const providerEmail = `security.provider.${suffix}@synthetic.example`;
		const nurseEmail = `security.nurse.${suffix}@synthetic.example`;
		const receptionistEmail = `security.receptionist.${suffix}@synthetic.example`;
		const portalEmail = `security.portal.${suffix}@synthetic.example`;
		const foreignEmail = `security.foreign.${suffix}@synthetic.example`;
		const catalog: MockIdpAccount[] = [
			{email: adminEmail, password, role: 'PRACTICE_ADMIN'},
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
			name: `Security North ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Security South ${suffix}`,
		});
		admin = await dataSource.getRepository(User).save({email: adminEmail});
		provider = await dataSource.getRepository(User).save({email: providerEmail});
		nurse = await dataSource.getRepository(User).save({email: nurseEmail});
		receptionist = await dataSource.getRepository(User).save({email: receptionistEmail});
		portalUser = await dataSource.getRepository(User).save({email: portalEmail});
		foreignAdmin = await dataSource.getRepository(User).save({email: foreignEmail});
		await dataSource.getRepository(PracticeMembership).save([
			{practiceId: practiceA.id, userId: admin.id, role: 'PRACTICE_ADMIN'},
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
				{email: provider?.email},
				{email: nurse?.email},
				{email: receptionist?.email},
				{email: portalUser?.email},
				{email: foreignAdmin?.email},
			],
		});
		const userIds = users.map((user) => user.id);
		if (practiceIds.length > 0) {
			await dataSource.getRepository(AuditEvent).delete({practiceId: In(practiceIds)});
		}
		if (userIds.length > 0) {
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
		const anonymous = await request(app.getHttpServer()).get('/admin/security-events').expect(401);
		expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

		for (const email of [provider.email, nurse.email, receptionist.email, portalUser.email]) {
			const token = await login(email);
			const denied = await request(app.getHttpServer())
				.get('/admin/security-events')
				.set('Authorization', `Bearer ${token}`)
				.expect(403);
			expect(denied.body.error.code).toBe('FORBIDDEN');
		}
	});

	it('lists tenant-scoped auth.* events without payloads or email oracles', async () => {
		const adminToken = await login(admin.email);

		await dataSource.getRepository(AuditEvent).save([
			{
				practiceId: practiceA.id,
				actorUserId: provider.id,
				action: 'patient.accessed',
				resourceType: 'patient',
				resourceId: null,
				correlationId: `cid-patient-${suffix}`,
			},
			{
				practiceId: practiceA.id,
				actorUserId: admin.id,
				action: 'access.denied',
				resourceType: 'admin',
				resourceId: null,
				correlationId: `cid-denied-${suffix}`,
			},
			{
				practiceId: practiceB.id,
				actorUserId: foreignAdmin.id,
				action: 'auth.login.succeeded',
				resourceType: 'session',
				resourceId: null,
				correlationId: `cid-foreign-${suffix}`,
			},
		]);

		const mismatch = await request(app.getHttpServer())
			.get('/admin/security-events')
			.query({practiceId: practiceB.id})
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');

		const before = await request(app.getHttpServer())
			.get('/admin/security-events')
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(200);
		const beforeEvents = before.body.events as SecurityEventBody[];
		const failedBefore = beforeEvents.filter((event) => event.action === 'auth.login.failed');

		const unknownEmail = `nobody.${suffix}@synthetic.example`;
		const unknownAttempt = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email: unknownEmail, password: 'wrong-password-1'})
			.expect(401);
		const knownAttempt = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email: admin.email, password: 'wrong-password-1'})
			.expect(401);
		expect(knownAttempt.body.error).toEqual(unknownAttempt.body.error);
		expect(knownAttempt.body.error.code).toBe('UNAUTHENTICATED');
		expect(knownAttempt.body.error.message).toBe('Invalid email or password');
		expect(JSON.stringify(knownAttempt.body)).not.toContain(admin.email);
		expect(JSON.stringify(unknownAttempt.body)).not.toContain(unknownEmail);

		const listed = await request(app.getHttpServer())
			.get('/admin/security-events')
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(200);

		const events = listed.body.events as SecurityEventBody[];
		expect(events.every((event) => event.practiceId === practiceA.id)).toBe(true);
		expect(events.every((event) => event.action.startsWith('auth.'))).toBe(true);
		expect(events.some((event) => event.action === 'auth.login.succeeded')).toBe(true);
		expect(events.some((event) => event.action === 'patient.accessed')).toBe(false);
		expect(events.some((event) => event.action === 'access.denied')).toBe(false);
		expect(events.some((event) => event.correlationId === `cid-foreign-${suffix}`)).toBe(false);

		const failedAfter = events.filter((event) => event.action === 'auth.login.failed');
		expect(failedAfter).toHaveLength(failedBefore.length + 1);
		expect(failedAfter.some((event) => event.actorUserId === admin.id && event.resourceId === null)).toBe(
			true,
		);

		const payload = JSON.stringify(listed.body);
		expect(payload).not.toContain(admin.email);
		expect(payload).not.toContain(password);
		expect(payload).not.toContain('wrong-password-1');
		expect(payload).not.toContain(unknownEmail);
		expect(listed.body).not.toHaveProperty('notes');
	});
});
