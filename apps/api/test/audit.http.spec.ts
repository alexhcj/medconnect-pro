import {randomUUID} from 'node:crypto';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {DataSource, In} from 'typeorm';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {MOCK_IDP_USERS, type MockIdpAccount} from '../src/identity/mock-idp.js';
import {configureApp} from '../src/platform/configure-app.js';
import {Appointment} from '../src/persistence/entities/appointment.entity.js';
import {AuditEvent} from '../src/persistence/entities/audit-event.entity.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {PatientAssignment} from '../src/persistence/entities/patient-assignment.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {syntheticDemographics, syntheticPatientColumns} from './synthetic-patient.js';

const password = 'Synthetic-Pass-1';

type AuditEventBody = {
	id: string;
	practiceId: string;
	actorUserId: string;
	action: string;
	resourceType: string;
	resourceId: string | null;
	correlationId: string;
	createdAt: string;
};

function patientBody(providerId: string) {
	const demographics = syntheticDemographics(providerId, {
		firstName: 'Riley',
		lastName: 'Chen',
		email: `riley.audit.${randomUUID().slice(0, 8)}@synthetic.example`,
	});
	return {
		firstName: demographics.firstName,
		lastName: demographics.lastName,
		dateOfBirth: demographics.dateOfBirth,
		gender: demographics.gender,
		status: demographics.status,
		phone: demographics.phone,
		email: demographics.email,
		address: {
			street: demographics.street,
			city: demographics.city,
			state: demographics.state,
			postalCode: demographics.postalCode,
		},
		emergencyContact: {
			name: demographics.emergencyContactName,
			relationship: demographics.emergencyContactRelationship,
			phone: demographics.emergencyContactPhone,
		},
		insurance: {
			provider: demographics.insuranceProvider,
			policyNumber: demographics.insurancePolicyNumber,
			groupNumber: demographics.insuranceGroupNumber,
		},
		providerId: demographics.providerId,
	};
}

describe('audit HTTP', () => {
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
		const adminEmail = `audit.admin.${suffix}@synthetic.example`;
		const providerEmail = `audit.provider.${suffix}@synthetic.example`;
		const nurseEmail = `audit.nurse.${suffix}@synthetic.example`;
		const receptionistEmail = `audit.receptionist.${suffix}@synthetic.example`;
		const portalEmail = `audit.portal.${suffix}@synthetic.example`;
		const foreignEmail = `audit.foreign.${suffix}@synthetic.example`;
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

		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();
		dataSource = app.get(DataSource);
		await dataSource.runMigrations();

		practiceA = await dataSource.getRepository(Practice).save({
			name: `Audit North ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Audit South ${suffix}`,
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
		await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Avery',
				lastName: `Audit${suffix}`,
				email: `avery.audit.${suffix}@synthetic.example`,
			}),
			portalUserId: portalUser.id,
		});
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
			await dataSource.getRepository(Appointment).delete({practiceId: In(practiceIds)});
		}
		if (userIds.length > 0) {
			await dataSource.getRepository(AuthSession).delete({userId: In(userIds)});
		}
		if (practiceIds.length > 0) {
			await dataSource.getRepository(PatientAssignment).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(Patient).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(PracticeMembership).delete({practiceId: In(practiceIds)});
		}
		if (userIds.length > 0) {
			await dataSource.getRepository(User).delete({id: In(userIds)});
		}
		if (practiceIds.length > 0) {
			await dataSource.getRepository(Practice).delete({id: In(practiceIds)});
		}
		await app?.close();
	});

	async function login(email: string): Promise<string> {
		const response = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email, password})
			.expect(200);
		return response.body.accessToken as string;
	}

	it('rejects anonymous and non-admin access', async () => {
		const anonymous = await request(app.getHttpServer()).get('/admin/audit-events').expect(401);
		expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

		for (const email of [provider.email, nurse.email, receptionist.email, portalUser.email]) {
			const token = await login(email);
			const denied = await request(app.getHttpServer())
				.get('/admin/audit-events')
				.set('Authorization', `Bearer ${token}`)
				.expect(403);
			expect(denied.body.error.code).toBe('FORBIDDEN');
		}
	});

	it('lists tenant-scoped events for a practice admin without payloads', async () => {
		const adminToken = await login(admin.email);
		await dataSource.getRepository(AuditEvent).save({
			practiceId: practiceB.id,
			actorUserId: foreignAdmin.id,
			action: 'patient.accessed',
			resourceType: 'patient',
			resourceId: null,
			correlationId: `cid-foreign-${suffix}`,
		});

		const receptionistToken = await login(receptionist.email);
		const createdPatient = await request(app.getHttpServer())
			.post('/patients')
			.set('Authorization', `Bearer ${receptionistToken}`)
			.send(patientBody(provider.id))
			.expect(201);

		await request(app.getHttpServer())
			.get(`/patients/${createdPatient.body.id}`)
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(200);

		const createdAppointment = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${receptionistToken}`)
			.send({
				patientId: createdPatient.body.id,
				providerId: provider.id,
				start: '2026-11-15T14:00:00.000Z',
				end: '2026-11-15T15:00:00.000Z',
				type: 'office_visit',
				state: 'scheduled',
				notes: 'Annual follow-up',
			})
			.expect(201);

		const providerToken = await login(provider.email);
		await request(app.getHttpServer())
			.get('/admin/audit-events')
			.set('Authorization', `Bearer ${providerToken}`)
			.expect(403);

		const mismatch = await request(app.getHttpServer())
			.get('/admin/audit-events')
			.query({practiceId: practiceB.id})
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');

		const listed = await request(app.getHttpServer())
			.get('/admin/audit-events')
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(200);

		const events = listed.body.events as AuditEventBody[];
		expect(events.every((event) => event.practiceId === practiceA.id)).toBe(true);
		expect(events.some((event) => event.action === 'auth.login.succeeded')).toBe(true);
		expect(events.some((event) => event.action === 'patient.created')).toBe(true);
		expect(events.some((event) => event.action === 'patient.accessed')).toBe(true);
		expect(
			events.some(
				(event) =>
					event.action === 'appointment.created' && event.resourceId === createdAppointment.body.id,
			),
		).toBe(true);
		expect(
			events.some((event) => event.action === 'access.denied' && event.resourceId === null),
		).toBe(true);
		expect(events.some((event) => event.correlationId === `cid-foreign-${suffix}`)).toBe(false);

		const payload = JSON.stringify(listed.body);
		expect(payload).not.toContain('Annual follow-up');
		expect(payload).not.toContain(admin.email);
		expect(payload).not.toContain(password);
		expect(payload).not.toMatch(/Riley|Chen/);
		expect(listed.body).not.toHaveProperty('notes');
	});
});
