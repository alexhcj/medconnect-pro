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
import {syntheticPatientColumns} from './synthetic-patient.js';

const password = 'Synthetic-Pass-1';

function appointmentBody(
	patientId: string,
	providerId: string,
	overrides: Record<string, unknown> = {},
) {
	return {
		patientId,
		providerId,
		start: '2026-10-15T14:00:00.000Z',
		end: '2026-10-15T15:00:00.000Z',
		type: 'office_visit',
		state: 'scheduled',
		notes: 'Annual follow-up',
		...overrides,
	};
}

describe('appointment HTTP', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let practiceA: Practice;
	let practiceB: Practice;
	let receptionist: User;
	let provider: User;
	let nurse: User;
	let portalUser: User;
	let outsider: User;
	let patient: Patient;
	let foreignPatient: Patient;
	const suffix = randomUUID().slice(0, 8);

	beforeAll(async () => {
		const receptionistEmail = `appt.receptionist.${suffix}@synthetic.example`;
		const providerEmail = `appt.provider.${suffix}@synthetic.example`;
		const nurseEmail = `appt.nurse.${suffix}@synthetic.example`;
		const portalEmail = `appt.portal.${suffix}@synthetic.example`;
		const catalog: MockIdpAccount[] = [
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
			name: `Appt North ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Appt South ${suffix}`,
		});
		receptionist = await dataSource.getRepository(User).save({email: receptionistEmail});
		provider = await dataSource.getRepository(User).save({email: providerEmail});
		nurse = await dataSource.getRepository(User).save({email: nurseEmail});
		portalUser = await dataSource.getRepository(User).save({email: portalEmail});
		outsider = await dataSource.getRepository(User).save({
			email: `appt.outsider.${suffix}@synthetic.example`,
		});
		await dataSource.getRepository(PracticeMembership).save([
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
				lastName: `Appt${suffix}`,
				email: `avery.appt.${suffix}@synthetic.example`,
			}),
			portalUserId: portalUser.id,
		});
		foreignPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceB.id,
			...syntheticPatientColumns(outsider.id, {
				firstName: 'Casey',
				lastName: `ForeignAppt${suffix}`,
				email: `foreign.appt.${suffix}@synthetic.example`,
			}),
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
				{email: receptionist?.email},
				{email: provider?.email},
				{email: nurse?.email},
				{email: portalUser?.email},
				{email: outsider?.email},
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

	it('rejects anonymous access and invalid appointment bodies', async () => {
		const anonymous = await request(app.getHttpServer()).get('/appointments').expect(401);
		expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

		const token = await login(receptionist.email);
		const invalid = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${token}`)
			.send({patientId: ''})
			.expect(400);
		expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
		expect(invalid.body.error.details.length).toBeGreaterThan(0);
		expect(JSON.stringify(invalid.body)).not.toMatch(/stack|password/i);
	});

	it('creates, lists, updates, and deletes an appointment for a receptionist', async () => {
		const token = await login(receptionist.email);
		const created = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${token}`)
			.set('X-Correlation-ID', `cid-create-${suffix}`)
			.send(appointmentBody(patient.id, provider.id))
			.expect(201);
		expect(created.body.synthetic).toBe(true);
		expect(created.body.practiceId).toBe(practiceA.id);
		expect(created.body.patientName).toBe(`Avery Appt${suffix}`);
		expect(created.body.providerName).toBe(provider.email);
		expect(created.body.notes).toBe('Annual follow-up');

		const audits = await dataSource.getRepository(AuditEvent).find({
			where: {practiceId: practiceA.id, resourceId: created.body.id},
		});
		const createdAudit = audits.find((event) => event.action === 'appointment.created');
		expect(createdAudit?.correlationId).toBe(`cid-create-${suffix}`);
		expect(JSON.stringify(audits)).not.toContain('Annual follow-up');

		const listed = await request(app.getHttpServer())
			.get('/appointments')
			.query({from: '2026-10-15T00:00:00.000Z', to: '2026-10-16T00:00:00.000Z'})
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listed.body.appointments.map((row: {id: string}) => row.id)).toContain(created.body.id);
		expect(listed.body.hasMore).toBe(false);

		const profile = await request(app.getHttpServer())
			.get(`/appointments/${created.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(profile.body.id).toBe(created.body.id);

		const updated = await request(app.getHttpServer())
			.patch(`/appointments/${created.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({state: 'confirmed'})
			.expect(200);
		expect(updated.body.state).toBe('confirmed');

		await request(app.getHttpServer())
			.delete(`/appointments/${created.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(204);

		await request(app.getHttpServer())
			.get(`/appointments/${created.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
	});

	it('rejects overlapping provider times and allows cancelled slots', async () => {
		const token = await login(receptionist.email);
		const first = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${token}`)
			.send(
				appointmentBody(patient.id, provider.id, {
					start: '2026-10-21T14:00:00.000Z',
					end: '2026-10-21T15:00:00.000Z',
					notes: 'Conflict source',
				}),
			)
			.expect(201);

		const conflict = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${token}`)
			.send(
				appointmentBody(patient.id, provider.id, {
					start: '2026-10-21T14:30:00.000Z',
					end: '2026-10-21T15:30:00.000Z',
				}),
			)
			.expect(409);
		expect(conflict.body.error).toMatchObject({
			code: 'APPOINTMENT_CONFLICT',
			details: [
				{
					path: 'start',
					message: 'This time overlaps an existing appointment for the provider.',
				},
			],
		});

		await request(app.getHttpServer())
			.patch(`/appointments/${first.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({state: 'cancelled'})
			.expect(200);

		const reused = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${token}`)
			.send(
				appointmentBody(patient.id, provider.id, {
					start: '2026-10-21T14:00:00.000Z',
					end: '2026-10-21T15:00:00.000Z',
					notes: 'Reused cancelled slot',
				}),
			)
			.expect(201);
		expect(reused.body.id).not.toBe(first.body.id);

		const self = await request(app.getHttpServer())
			.patch(`/appointments/${reused.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({
				start: '2026-10-21T14:00:00.000Z',
				end: '2026-10-21T15:00:00.000Z',
				notes: 'Same window',
			})
			.expect(200);
		expect(self.body.id).toBe(reused.body.id);
	});

	it('rejects concurrent overlapping inserts for the same provider', async () => {
		const token = await login(receptionist.email);
		const slot = appointmentBody(patient.id, provider.id, {
			start: '2026-10-22T10:00:00.000Z',
			end: '2026-10-22T11:00:00.000Z',
			notes: 'Race',
		});
		const [first, second] = await Promise.all([
			request(app.getHttpServer())
				.post('/appointments')
				.set('Authorization', `Bearer ${token}`)
				.send(slot),
			request(app.getHttpServer())
				.post('/appointments')
				.set('Authorization', `Bearer ${token}`)
				.send(slot),
		]);
		const statuses = [first.status, second.status].sort();
		expect(statuses).toEqual([201, 409]);
	});

	it('denies writes from a nurse and a patient user', async () => {
		const nurseToken = await login(nurse.email);
		const nurseDenied = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${nurseToken}`)
			.send(appointmentBody(patient.id, provider.id, {start: '2026-10-23T10:00:00.000Z', end: '2026-10-23T11:00:00.000Z'}))
			.expect(403);
		expect(nurseDenied.body.error.code).toBe('FORBIDDEN');

		const patientToken = await login(portalUser.email);
		const patientDenied = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${patientToken}`)
			.send(appointmentBody(patient.id, provider.id, {start: '2026-10-23T12:00:00.000Z', end: '2026-10-23T13:00:00.000Z'}))
			.expect(403);
		expect(patientDenied.body.error.code).toBe('FORBIDDEN');
	});

	it('limits nurses to assigned patients and hides cross-tenant ids', async () => {
		const receptionistToken = await login(receptionist.email);
		const assigned = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${receptionistToken}`)
			.send(
				appointmentBody(patient.id, provider.id, {
					start: '2026-10-24T10:00:00.000Z',
					end: '2026-10-24T11:00:00.000Z',
					notes: 'Assigned visit',
				}),
			)
			.expect(201);
		const hiddenPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Hidden',
				lastName: `ZephyrAppt${suffix}`,
				email: `hidden.appt.${suffix}@synthetic.example`,
			}),
		});
		const hidden = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${receptionistToken}`)
			.send(
				appointmentBody(hiddenPatient.id, provider.id, {
					start: '2026-10-24T12:00:00.000Z',
					end: '2026-10-24T13:00:00.000Z',
					notes: 'Hidden visit',
				}),
			)
			.expect(201);

		const nurseToken = await login(nurse.email);
		const before = await request(app.getHttpServer())
			.get('/appointments')
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(200);
		expect(before.body.appointments).toEqual([]);

		const missing = await request(app.getHttpServer())
			.get(`/appointments/${hidden.body.id}`)
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(404);
		expect(missing.body.error).toMatchObject({code: 'NOT_FOUND', message: 'Resource not found'});
		expect(JSON.stringify(missing.body)).not.toContain('Hidden visit');

		await dataSource.getRepository(PatientAssignment).save({
			practiceId: practiceA.id,
			patientId: patient.id,
			userId: nurse.id,
		});

		const after = await request(app.getHttpServer())
			.get('/appointments')
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(200);
		expect(after.body.appointments.map((row: {id: string}) => row.id)).toContain(assigned.body.id);
		expect(after.body.appointments.map((row: {id: string}) => row.id)).not.toContain(hidden.body.id);
	});

	it('lets a patient user read only their own appointments', async () => {
		const receptionistToken = await login(receptionist.email);
		const own = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${receptionistToken}`)
			.send(
				appointmentBody(patient.id, provider.id, {
					start: '2026-10-25T10:00:00.000Z',
					end: '2026-10-25T11:00:00.000Z',
				}),
			)
			.expect(201);
		const otherPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Other',
				lastName: `OtherAppt${suffix}`,
				email: `other.appt.${suffix}@synthetic.example`,
			}),
		});
		const other = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${receptionistToken}`)
			.send(
				appointmentBody(otherPatient.id, provider.id, {
					start: '2026-10-25T12:00:00.000Z',
					end: '2026-10-25T13:00:00.000Z',
				}),
			)
			.expect(201);

		const token = await login(portalUser.email);
		const listed = await request(app.getHttpServer())
			.get('/appointments')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listed.body.appointments.map((row: {id: string}) => row.id)).toContain(own.body.id);
		expect(listed.body.appointments.map((row: {id: string}) => row.id)).not.toContain(other.body.id);

		await request(app.getHttpServer())
			.get(`/appointments/${other.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
	});

	it('hides a cross-tenant appointment and rejects a client practice id', async () => {
		const foreignAppointment = await dataSource.getRepository(Appointment).save({
			practiceId: practiceB.id,
			patientId: foreignPatient.id,
			providerUserId: outsider.id,
			startAt: new Date('2026-10-26T10:00:00.000Z'),
			endAt: new Date('2026-10-26T11:00:00.000Z'),
			type: 'office_visit',
			state: 'scheduled',
			synthetic: true,
		});
		const token = await login(receptionist.email);
		const missing = await request(app.getHttpServer())
			.get(`/appointments/${foreignAppointment.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(missing.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(missing.body)).not.toContain(practiceB.id);

		const mismatch = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${token}`)
			.send({
				...appointmentBody(patient.id, provider.id, {
					start: '2026-10-26T14:00:00.000Z',
					end: '2026-10-26T15:00:00.000Z',
				}),
				practiceId: practiceB.id,
			})
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');
		expect(JSON.stringify(mismatch.body)).not.toContain(practiceB.id);

		const badPatient = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${token}`)
			.send(
				appointmentBody(foreignPatient.id, provider.id, {
					start: '2026-10-26T16:00:00.000Z',
					end: '2026-10-26T17:00:00.000Z',
				}),
			)
			.expect(400);
		expect(badPatient.body.error.details[0].path).toBe('patientId');
	});

	it('returns provider availability with busy and free intervals', async () => {
		const token = await login(receptionist.email);
		await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${token}`)
			.send(
				appointmentBody(patient.id, provider.id, {
					start: '2026-10-14T14:00:00.000Z',
					end: '2026-10-14T15:00:00.000Z',
				}),
			)
			.expect(201);

		const availability = await request(app.getHttpServer())
			.get(`/providers/${provider.id}/availability`)
			.query({from: '2026-10-14T00:00:00.000Z', to: '2026-10-15T00:00:00.000Z'})
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(availability.body.timeZone).toBe('UTC');
		expect(availability.body.workingHours).toEqual(
			expect.arrayContaining([expect.objectContaining({weekday: 3, startLocal: '09:00', endLocal: '17:00'})]),
		);
		expect(availability.body.busy).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					start: '2026-10-14T14:00:00.000Z',
					end: '2026-10-14T15:00:00.000Z',
				}),
			]),
		);
		expect(availability.body.free).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					start: '2026-10-14T09:00:00.000Z',
					end: '2026-10-14T14:00:00.000Z',
				}),
				expect.objectContaining({
					start: '2026-10-14T15:00:00.000Z',
					end: '2026-10-14T17:00:00.000Z',
				}),
			]),
		);

		const missing = await request(app.getHttpServer())
			.get(`/providers/${outsider.id}/availability`)
			.query({from: '2026-10-14T00:00:00.000Z', to: '2026-10-15T00:00:00.000Z'})
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(missing.body.error.code).toBe('NOT_FOUND');
	});
});
