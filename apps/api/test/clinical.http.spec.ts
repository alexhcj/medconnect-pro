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
import {ClinicalCondition} from '../src/persistence/entities/clinical-condition.entity.js';
import {ClinicalHistory} from '../src/persistence/entities/clinical-history.entity.js';
import {Medication} from '../src/persistence/entities/medication.entity.js';
import {PatientAssignment} from '../src/persistence/entities/patient-assignment.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {Vital} from '../src/persistence/entities/vital.entity.js';
import {syntheticPatientColumns} from './synthetic-patient.js';

const password = 'Synthetic-Pass-1';

function historyBody(overrides: Record<string, unknown> = {}) {
	return {
		type: 'visit',
		occurredAt: '2025-07-15T10:30:00.000Z',
		title: 'Hypertension follow-up',
		summary: 'Blood pressure stable on current medication.',
		status: 'completed',
		...overrides,
	};
}

function conditionBody(overrides: Record<string, unknown> = {}) {
	return {
		display: 'Hypertension',
		clinicalStatus: 'active',
		recordedAt: '2025-07-15T10:30:00.000Z',
		...overrides,
	};
}

function vitalBody(overrides: Record<string, unknown> = {}) {
	return {
		recordedAt: '2025-07-15T10:15:00.000Z',
		systolicMmHg: 128,
		diastolicMmHg: 82,
		heartRateBpm: 72,
		temperatureC: 36.7,
		respiratoryRate: 16,
		spo2Percent: 98,
		weightKg: 72.5,
		...overrides,
	};
}

function medicationBody(overrides: Record<string, unknown> = {}) {
	return {
		name: 'Lisinopril',
		dosage: '10mg',
		frequency: 'Once daily',
		route: 'oral',
		startDate: '2023-01-10',
		instructions: 'Take in the morning with water',
		status: 'active',
		...overrides,
	};
}

describe('clinical HTTP', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let practiceA: Practice;
	let practiceB: Practice;
	let practiceAdmin: User;
	let receptionist: User;
	let provider: User;
	let nurse: User;
	let portalUser: User;
	let patient: Patient;
	let unassignedPatient: Patient;
	let foreignPatient: Patient;
	const suffix = randomUUID().slice(0, 8);

	beforeAll(async () => {
		const adminEmail = `ehr.admin.${suffix}@synthetic.example`;
		const receptionistEmail = `ehr.receptionist.${suffix}@synthetic.example`;
		const providerEmail = `ehr.provider.${suffix}@synthetic.example`;
		const nurseEmail = `ehr.nurse.${suffix}@synthetic.example`;
		const portalEmail = `ehr.portal.${suffix}@synthetic.example`;
		const catalog: MockIdpAccount[] = [
			{email: adminEmail, password, role: 'PRACTICE_ADMIN'},
			{email: receptionistEmail, password, role: 'RECEPTIONIST'},
			{email: providerEmail, password, role: 'PROVIDER'},
			{email: nurseEmail, password, role: 'NURSE'},
			{email: portalEmail, password, role: 'PATIENT'},
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
			name: `Ehr North ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Ehr South ${suffix}`,
		});
		practiceAdmin = await dataSource.getRepository(User).save({email: adminEmail});
		receptionist = await dataSource.getRepository(User).save({email: receptionistEmail});
		provider = await dataSource.getRepository(User).save({email: providerEmail});
		nurse = await dataSource.getRepository(User).save({email: nurseEmail});
		portalUser = await dataSource.getRepository(User).save({email: portalEmail});
		const outsider = await dataSource.getRepository(User).save({
			email: `ehr.outsider.${suffix}@synthetic.example`,
		});
		await dataSource.getRepository(PracticeMembership).save([
			{practiceId: practiceA.id, userId: practiceAdmin.id, role: 'PRACTICE_ADMIN'},
			{practiceId: practiceA.id, userId: receptionist.id, role: 'RECEPTIONIST'},
			{practiceId: practiceA.id, userId: provider.id, role: 'PROVIDER'},
			{practiceId: practiceA.id, userId: nurse.id, role: 'NURSE'},
			{practiceId: practiceA.id, userId: portalUser.id, role: 'PATIENT'},
			{practiceId: practiceB.id, userId: outsider.id, role: 'PROVIDER'},
		]);
		patient = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Avery',
				lastName: `Ehr${suffix}`,
				email: `avery.ehr.${suffix}@synthetic.example`,
			}),
			portalUserId: portalUser.id,
		});
		unassignedPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Hidden',
				lastName: `ZephyrEhr${suffix}`,
				email: `hidden.ehr.${suffix}@synthetic.example`,
			}),
		});
		foreignPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceB.id,
			...syntheticPatientColumns(outsider.id, {
				firstName: 'Casey',
				lastName: `ForeignEhr${suffix}`,
				email: `foreign.ehr.${suffix}@synthetic.example`,
			}),
		});
		await dataSource.getRepository(PatientAssignment).save({
			practiceId: practiceA.id,
			patientId: patient.id,
			userId: nurse.id,
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
				{email: practiceAdmin?.email},
				{email: receptionist?.email},
				{email: provider?.email},
				{email: nurse?.email},
				{email: portalUser?.email},
				{email: `ehr.outsider.${suffix}@synthetic.example`},
			],
		});
		const userIds = users.map((user) => user.id);
		if (practiceIds.length > 0) {
			await dataSource.getRepository(AuditEvent).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(ClinicalHistory).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(ClinicalCondition).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(Vital).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(Medication).delete({practiceId: In(practiceIds)});
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

	it('rejects anonymous access and invalid clinical bodies', async () => {
		const anonymous = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/history`)
			.expect(401);
		expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

		const token = await login(provider.email);
		const invalid = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/vitals`)
			.set('Authorization', `Bearer ${token}`)
			.send({systolicMmHg: 0})
			.expect(400);
		expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
		expect(invalid.body.error.details.length).toBeGreaterThan(0);
		expect(JSON.stringify(invalid.body)).not.toMatch(/stack|password/i);
	});

	it('lets a provider create and list all four clinical collections', async () => {
		const token = await login(provider.email);
		const history = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/history`)
			.set('Authorization', `Bearer ${token}`)
			.set('X-Correlation-ID', `cid-history-${suffix}`)
			.send(historyBody())
			.expect(201);
		expect(history.body.synthetic).toBe(true);
		expect(history.body.practiceId).toBe(practiceA.id);
		expect(history.body.providerId).toBe(provider.id);
		expect(history.body.title).toBe('Hypertension follow-up');

		const condition = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/conditions`)
			.set('Authorization', `Bearer ${token}`)
			.send(conditionBody())
			.expect(201);
		expect(condition.body.display).toBe('Hypertension');
		expect(condition.body.recordedById).toBe(provider.id);

		const vital = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/vitals`)
			.set('Authorization', `Bearer ${token}`)
			.send(vitalBody())
			.expect(201);
		expect(vital.body.systolicMmHg).toBe(128);
		expect(vital.body.recordedById).toBe(provider.id);

		const medication = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/medications`)
			.set('Authorization', `Bearer ${token}`)
			.send(medicationBody())
			.expect(201);
		expect(medication.body.name).toBe('Lisinopril');
		expect(medication.body.prescriberId).toBe(provider.id);
		expect(medication.body.synthetic).toBe(true);

		const listedHistory = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/history`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listedHistory.body.history.map((row: {id: string}) => row.id)).toContain(history.body.id);

		const listedConditions = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/conditions`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listedConditions.body.conditions.map((row: {id: string}) => row.id)).toContain(
			condition.body.id,
		);

		const listedVitals = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/vitals`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listedVitals.body.vitals.map((row: {id: string}) => row.id)).toContain(vital.body.id);

		const listedMedications = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/medications`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listedMedications.body.medications.map((row: {id: string}) => row.id)).toContain(
			medication.body.id,
		);

		const audits = await dataSource.getRepository(AuditEvent).find({
			where: {practiceId: practiceA.id, resourceId: history.body.id},
		});
		const createdAudit = audits.find((event) => event.action === 'history.created');
		expect(createdAudit?.correlationId).toBe(`cid-history-${suffix}`);
		expect(createdAudit?.resourceType).toBe('history');
		expect(JSON.stringify(audits)).not.toContain('Blood pressure stable');
		expect(JSON.stringify(audits)).not.toContain('Lisinopril');
	});

	it('lets an assigned nurse write vitals and forbids medical records', async () => {
		const token = await login(nurse.email);
		const vital = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/vitals`)
			.set('Authorization', `Bearer ${token}`)
			.send(vitalBody({recordedAt: '2025-07-16T09:00:00.000Z', systolicMmHg: 120}))
			.expect(201);
		expect(vital.body.recordedById).toBe(nurse.id);

		const listed = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/vitals`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listed.body.vitals.map((row: {id: string}) => row.id)).toContain(vital.body.id);

		const historyDenied = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/history`)
			.set('Authorization', `Bearer ${token}`)
			.expect(403);
		expect(historyDenied.body.error.code).toBe('FORBIDDEN');
		await request(app.getHttpServer())
			.get(`/patients/${patient.id}/conditions`)
			.set('Authorization', `Bearer ${token}`)
			.expect(403);
		await request(app.getHttpServer())
			.get(`/patients/${patient.id}/medications`)
			.set('Authorization', `Bearer ${token}`)
			.expect(403);

		await request(app.getHttpServer())
			.post(`/patients/${patient.id}/history`)
			.set('Authorization', `Bearer ${token}`)
			.send(historyBody())
			.expect(403);
		await request(app.getHttpServer())
			.post(`/patients/${patient.id}/conditions`)
			.set('Authorization', `Bearer ${token}`)
			.send(conditionBody())
			.expect(403);
		await request(app.getHttpServer())
			.post(`/patients/${patient.id}/medications`)
			.set('Authorization', `Bearer ${token}`)
			.send(medicationBody())
			.expect(403);
	});

	it('hides unassigned patients from a nurse', async () => {
		const token = await login(nurse.email);
		const missing = await request(app.getHttpServer())
			.get(`/patients/${unassignedPatient.id}/vitals`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(missing.body.error).toMatchObject({code: 'NOT_FOUND', message: 'Resource not found'});
		expect(JSON.stringify(missing.body)).not.toContain(`ZephyrEhr${suffix}`);
	});

	it('denies clinical access to a receptionist and practice admin', async () => {
		for (const email of [receptionist.email, practiceAdmin.email]) {
			const token = await login(email);
			const getDenied = await request(app.getHttpServer())
				.get(`/patients/${patient.id}/history`)
				.set('Authorization', `Bearer ${token}`)
				.expect(403);
			expect(getDenied.body.error.code).toBe('FORBIDDEN');
			const postDenied = await request(app.getHttpServer())
				.post(`/patients/${patient.id}/vitals`)
				.set('Authorization', `Bearer ${token}`)
				.send(vitalBody())
				.expect(403);
			expect(postDenied.body.error.code).toBe('FORBIDDEN');
		}
	});

	it('lets a portal user read own clinical records and denies writes and other patients', async () => {
		const providerToken = await login(provider.email);
		await request(app.getHttpServer())
			.post(`/patients/${patient.id}/history`)
			.set('Authorization', `Bearer ${providerToken}`)
			.send(historyBody({title: 'Portal-visible visit', summary: 'Synthetic portal summary.'}))
			.expect(201);

		const token = await login(portalUser.email);
		const own = await request(app.getHttpServer())
			.get(`/patients/${patient.id}/history`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(own.body.history.some((row: {title: string}) => row.title === 'Portal-visible visit')).toBe(
			true,
		);

		const writeDenied = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/history`)
			.set('Authorization', `Bearer ${token}`)
			.send(historyBody())
			.expect(403);
		expect(writeDenied.body.error.code).toBe('FORBIDDEN');

		const other = await request(app.getHttpServer())
			.get(`/patients/${unassignedPatient.id}/history`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(other.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(other.body)).not.toContain(`ZephyrEhr${suffix}`);
	});

	it('hides a cross-tenant patient and rejects a client practice id', async () => {
		const token = await login(provider.email);
		const missing = await request(app.getHttpServer())
			.get(`/patients/${foreignPatient.id}/vitals`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(missing.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(missing.body)).not.toContain(practiceB.id);
		expect(JSON.stringify(missing.body)).not.toContain(`ForeignEhr${suffix}`);

		const mismatch = await request(app.getHttpServer())
			.post(`/patients/${patient.id}/vitals`)
			.set('Authorization', `Bearer ${token}`)
			.send({
				...vitalBody({recordedAt: '2025-08-01T10:00:00.000Z'}),
				practiceId: practiceB.id,
			})
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');
		expect(JSON.stringify(mismatch.body)).not.toContain(practiceB.id);
	});
});
