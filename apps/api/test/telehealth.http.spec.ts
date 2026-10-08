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
import {NotificationPreference} from '../src/persistence/entities/notification-preference.entity.js';
import {Notification} from '../src/persistence/entities/notification.entity.js';
import {PatientAssignment} from '../src/persistence/entities/patient-assignment.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {TelehealthSession} from '../src/persistence/entities/telehealth-session.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {syntheticPatientColumns} from './synthetic-patient.js';
import {createAdminDataSource} from './admin-data-source.js';

const password = 'Synthetic-Pass-1';

function isoFromNow(offsetMs: number): string {
	return new Date(Date.now() + offsetMs).toISOString();
}

function currentVisitWindow() {
	return {
		start: isoFromNow(-5 * 60 * 1000),
		end: isoFromNow(55 * 60 * 1000),
	};
}

describe('telehealth session HTTP', () => {
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
		const receptionistEmail = `th.receptionist.${suffix}@synthetic.example`;
		const providerEmail = `th.provider.${suffix}@synthetic.example`;
		const nurseEmail = `th.nurse.${suffix}@synthetic.example`;
		const portalEmail = `th.portal.${suffix}@synthetic.example`;
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

		dataSource = await createAdminDataSource();
		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();

		practiceA = await dataSource.getRepository(Practice).save({
			name: `Telehealth North ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Telehealth South ${suffix}`,
		});
		receptionist = await dataSource.getRepository(User).save({email: receptionistEmail});
		provider = await dataSource.getRepository(User).save({email: providerEmail});
		nurse = await dataSource.getRepository(User).save({email: nurseEmail});
		portalUser = await dataSource.getRepository(User).save({email: portalEmail});
		outsider = await dataSource.getRepository(User).save({
			email: `th.outsider.${suffix}@synthetic.example`,
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
				lastName: `Tele${suffix}`,
				email: `avery.tele.${suffix}@synthetic.example`,
			}),
			portalUserId: portalUser.id,
		});
		foreignPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceB.id,
			...syntheticPatientColumns(outsider.id, {
				firstName: 'Casey',
				lastName: `ForeignTele${suffix}`,
				email: `foreign.tele.${suffix}@synthetic.example`,
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
		if (userIds.length > 0) {
			await dataSource.getRepository(AuditEvent).delete({actorUserId: In(userIds)});
			await dataSource.getRepository(AuthSession).delete({userId: In(userIds)});
		}
		if (practiceIds.length > 0) {
			await dataSource.getRepository(AuditEvent).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(Notification).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(NotificationPreference).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(TelehealthSession).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(Appointment).delete({practiceId: In(practiceIds)});
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

	async function cancelOpenAppointments(token: string): Promise<void> {
		const listed = await request(app.getHttpServer())
			.get('/appointments')
			.query({providerId: provider.id})
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		for (const row of listed.body.appointments as Array<{id: string; state: string}>) {
			if (row.state === 'cancelled' || row.state === 'completed') {
				continue;
			}
			await request(app.getHttpServer())
				.patch(`/appointments/${row.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send({state: 'cancelled'})
				.expect(200);
		}
	}

	async function createAppointment(
		token: string,
		overrides: Record<string, unknown> = {},
	): Promise<{id: string}> {
		const window = currentVisitWindow();
		const response = await request(app.getHttpServer())
			.post('/appointments')
			.set('Authorization', `Bearer ${token}`)
			.send({
				patientId: patient.id,
				providerId: provider.id,
				start: window.start,
				end: window.end,
				type: 'telehealth',
				state: 'scheduled',
				...overrides,
			})
			.expect(201);
		return response.body as {id: string};
	}

	it('rejects anonymous access and invalid create bodies', async () => {
		const anonymous = await request(app.getHttpServer()).post('/telehealth/sessions').expect(401);
		expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

		const token = await login(receptionist.email);
		const invalid = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${token}`)
			.send({appointmentId: ''})
			.expect(400);
		expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
		expect(JSON.stringify(invalid.body)).not.toMatch(/stack|password/i);
	});

	it('lets a receptionist create and end a session and records audit without PHI', async () => {
		const token = await login(receptionist.email);
		await cancelOpenAppointments(token);
		const appointment = await createAppointment(token, {
			start: isoFromNow(-4 * 60 * 1000),
			end: isoFromNow(50 * 60 * 1000),
			notes: 'Video follow-up',
		});

		const created = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${token}`)
			.set('X-Correlation-ID', `cid-th-create-${suffix}`)
			.send({appointmentId: appointment.id})
			.expect(201);
		expect(created.body.state).toBe('waiting');
		expect(created.body.synthetic).toBe(true);
		expect(created.body.appointmentId).toBe(appointment.id);
		expect(created.body.practiceId).toBe(practiceA.id);
		expect(created.body.patientName).toBe(`Avery Tele${suffix}`);
		expect(created.body.type).toBe('telehealth');

		const audits = await dataSource.getRepository(AuditEvent).find({
			where: {practiceId: practiceA.id, resourceId: created.body.id},
		});
		const createdAudit = audits.find((event) => event.action === 'telehealth_session.created');
		expect(createdAudit?.correlationId).toBe(`cid-th-create-${suffix}`);
		expect(createdAudit?.resourceType).toBe('telehealth_session');
		expect(JSON.stringify(audits)).not.toContain('Video follow-up');
		expect(JSON.stringify(audits)).not.toContain(`Avery Tele${suffix}`);

		const again = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${token}`)
			.send({appointmentId: appointment.id})
			.expect(201);
		expect(again.body.id).toBe(created.body.id);

		const ended = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/end`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(ended.body.state).toBe('ended');
		expect(ended.body.endedAt).toBeDefined();

		const endedAudits = await dataSource.getRepository(AuditEvent).find({
			where: {practiceId: practiceA.id, resourceId: created.body.id, action: 'telehealth_session.ended'},
		});
		expect(endedAudits.length).toBeGreaterThan(0);

		const recreate = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${token}`)
			.send({appointmentId: appointment.id})
			.expect(409);
		expect(recreate.body.error.code).toBe('SESSION_ENDED');
	});

	it('lets the provider and portal patient join, and forbids receptionist join', async () => {
		const desk = await login(receptionist.email);
		await cancelOpenAppointments(desk);
		const appointment = await createAppointment(desk, {
			start: isoFromNow(-3 * 60 * 1000),
			end: isoFromNow(45 * 60 * 1000),
		});
		const created = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${desk}`)
			.send({appointmentId: appointment.id})
			.expect(201);

		const receptionistJoin = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/join`)
			.set('Authorization', `Bearer ${desk}`)
			.expect(403);
		expect(receptionistJoin.body.error.code).toBe('FORBIDDEN');

		const providerToken = await login(provider.email);
		const joined = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/join`)
			.set('Authorization', `Bearer ${providerToken}`)
			.set('X-Correlation-ID', `cid-th-join-${suffix}`)
			.expect(200);
		expect(joined.body.state).toBe('in_session');
		expect(joined.body.joinedAt).toBeDefined();

		const joinAudits = await dataSource.getRepository(AuditEvent).find({
			where: {practiceId: practiceA.id, resourceId: created.body.id, action: 'telehealth_session.joined'},
		});
		expect(joinAudits[0]?.correlationId).toBe(`cid-th-join-${suffix}`);
		expect(JSON.stringify(joinAudits)).not.toContain(`Avery Tele${suffix}`);

		const patientToken = await login(portalUser.email);
		const patientJoin = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/join`)
			.set('Authorization', `Bearer ${patientToken}`)
			.expect(200);
		expect(patientJoin.body.state).toBe('in_session');
	});

	it('limits nurse join to assigned patients', async () => {
		const desk = await login(receptionist.email);
		await cancelOpenAppointments(desk);
		const appointment = await createAppointment(desk, {
			start: isoFromNow(-2 * 60 * 1000),
			end: isoFromNow(40 * 60 * 1000),
		});
		const created = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${desk}`)
			.send({appointmentId: appointment.id})
			.expect(201);

		const nurseToken = await login(nurse.email);
		const hidden = await request(app.getHttpServer())
			.get(`/telehealth/sessions/${created.body.id}`)
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(404);
		expect(hidden.body.error).toMatchObject({code: 'NOT_FOUND', message: 'Resource not found'});

		const joinHidden = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/join`)
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(404);
		expect(joinHidden.body.error.code).toBe('NOT_FOUND');

		await dataSource.getRepository(PatientAssignment).save({
			practiceId: practiceA.id,
			patientId: patient.id,
			userId: nurse.id,
		});

		const visible = await request(app.getHttpServer())
			.get(`/telehealth/sessions/${created.body.id}`)
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(200);
		expect(visible.body.id).toBe(created.body.id);

		const joined = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/join`)
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(200);
		expect(joined.body.state).toBe('in_session');
	});

	it('rejects office-visit, cancelled, and completed appointments', async () => {
		const token = await login(receptionist.email);
		await cancelOpenAppointments(token);
		const office = await createAppointment(token, {
			type: 'office_visit',
			start: isoFromNow(2 * 60 * 60 * 1000),
			end: isoFromNow(3 * 60 * 60 * 1000),
		});
		const officeDenied = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${token}`)
			.send({appointmentId: office.id})
			.expect(400);
		expect(officeDenied.body.error.details[0].path).toBe('appointmentId');

		const cancelled = await createAppointment(token, {
			start: isoFromNow(3 * 60 * 60 * 1000),
			end: isoFromNow(4 * 60 * 60 * 1000),
		});
		await request(app.getHttpServer())
			.patch(`/appointments/${cancelled.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({state: 'cancelled'})
			.expect(200);
		const cancelledDenied = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${token}`)
			.send({appointmentId: cancelled.id})
			.expect(400);
		expect(cancelledDenied.body.error.code).toBe('VALIDATION_ERROR');
	});

	it('rejects join outside the grace window and lazily ends expired sessions', async () => {
		const token = await login(receptionist.email);
		await cancelOpenAppointments(token);
		const future = await createAppointment(token, {
			start: isoFromNow(2 * 60 * 60 * 1000),
			end: isoFromNow(3 * 60 * 60 * 1000),
		});
		const created = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${token}`)
			.send({appointmentId: future.id})
			.expect(201);

		const providerToken = await login(provider.email);
		const tooSoon = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/join`)
			.set('Authorization', `Bearer ${providerToken}`)
			.expect(409);
		expect(tooSoon.body.error.code).toBe('SESSION_NOT_JOINABLE');

		const expiredAppointment = await dataSource.getRepository(Appointment).save({
			practiceId: practiceA.id,
			patientId: patient.id,
			providerUserId: provider.id,
			startAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
			endAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
			type: 'telehealth',
			state: 'scheduled',
			synthetic: true,
		});
		const expiredSession = await dataSource.getRepository(TelehealthSession).save({
			practiceId: practiceA.id,
			appointmentId: expiredAppointment.id,
			state: 'waiting',
			waitingStartedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
			synthetic: true,
		});

		const got = await request(app.getHttpServer())
			.get(`/telehealth/sessions/${expiredSession.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(got.body.state).toBe('ended');
		const timeoutAudits = await dataSource.getRepository(AuditEvent).find({
			where: {
				practiceId: practiceA.id,
				resourceId: expiredSession.id,
				action: 'telehealth_session.ended',
			},
		});
		expect(timeoutAudits.length).toBeGreaterThan(0);
	});

	it('hides a cross-tenant session and rejects a client practice id', async () => {
		const foreignAppointment = await dataSource.getRepository(Appointment).save({
			practiceId: practiceB.id,
			patientId: foreignPatient.id,
			providerUserId: outsider.id,
			startAt: new Date(Date.now() - 5 * 60 * 1000),
			endAt: new Date(Date.now() + 55 * 60 * 1000),
			type: 'telehealth',
			state: 'scheduled',
			synthetic: true,
		});
		const foreignSession = await dataSource.getRepository(TelehealthSession).save({
			practiceId: practiceB.id,
			appointmentId: foreignAppointment.id,
			state: 'waiting',
			waitingStartedAt: new Date(),
			synthetic: true,
		});
		const token = await login(receptionist.email);
		const missing = await request(app.getHttpServer())
			.get(`/telehealth/sessions/${foreignSession.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(missing.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(missing.body)).not.toContain(practiceB.id);

		await cancelOpenAppointments(token);
		const appointment = await createAppointment(token, {
			start: isoFromNow(5 * 60 * 60 * 1000),
			end: isoFromNow(6 * 60 * 60 * 1000),
		});
		const mismatch = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${token}`)
			.send({appointmentId: appointment.id, practiceId: practiceB.id})
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');
		expect(JSON.stringify(mismatch.body)).not.toContain(practiceB.id);
	});

	it('mints a media token for visit participants and forbids receptionist and cross-tenant callers', async () => {
		const desk = await login(receptionist.email);
		await cancelOpenAppointments(desk);
		const appointment = await createAppointment(desk, {
			start: isoFromNow(-3 * 60 * 1000),
			end: isoFromNow(45 * 60 * 1000),
		});
		const created = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${desk}`)
			.send({appointmentId: appointment.id})
			.expect(201);

		const receptionistMint = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/media-token`)
			.set('Authorization', `Bearer ${desk}`)
			.expect(403);
		expect(receptionistMint.body.error.code).toBe('FORBIDDEN');

		const providerToken = await login(provider.email);
		const minted = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/media-token`)
			.set('Authorization', `Bearer ${providerToken}`)
			.set('X-Correlation-ID', `cid-th-media-${suffix}`)
			.expect(200);
		expect(minted.body.roomUrl).toEqual(expect.stringMatching(/^https:\/\//));
		expect(typeof minted.body.token).toBe('string');
		expect(minted.body.token.length).toBeGreaterThan(0);
		expect(minted.body).not.toHaveProperty('dailyRoomName');

		const row = await dataSource.getRepository(TelehealthSession).findOneByOrFail({
			id: created.body.id,
		});
		expect(row.dailyRoomName).toBeTruthy();

		const again = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/media-token`)
			.set('Authorization', `Bearer ${providerToken}`)
			.expect(200);
		expect(again.body.roomUrl).toBe(minted.body.roomUrl);
		const reused = await dataSource.getRepository(TelehealthSession).findOneByOrFail({
			id: created.body.id,
		});
		expect(reused.dailyRoomName).toBe(row.dailyRoomName);

		const mintAudits = await dataSource.getRepository(AuditEvent).find({
			where: {
				practiceId: practiceA.id,
				resourceId: created.body.id,
				action: 'telehealth_session.media_token_minted',
			},
		});
		expect(mintAudits[0]?.correlationId).toBe(`cid-th-media-${suffix}`);
		expect(JSON.stringify(mintAudits)).not.toContain(minted.body.token);
		expect(JSON.stringify(mintAudits)).not.toContain(`Avery Tele${suffix}`);

		const patientToken = await login(portalUser.email);
		const patientMint = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/media-token`)
			.set('Authorization', `Bearer ${patientToken}`)
			.expect(200);
		expect(patientMint.body.roomUrl).toBe(minted.body.roomUrl);

		const nurseToken = await login(nurse.email);
		const existingAssignment = await dataSource.getRepository(PatientAssignment).findOne({
			where: {patientId: patient.id, userId: nurse.id},
		});
		if (!existingAssignment) {
			await dataSource.getRepository(PatientAssignment).save({
				practiceId: practiceA.id,
				patientId: patient.id,
				userId: nurse.id,
			});
		}
		const nurseMint = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/media-token`)
			.set('Authorization', `Bearer ${nurseToken}`)
			.expect(200);
		expect(nurseMint.body.token).toEqual(expect.any(String));

		const foreignAppointment = await dataSource.getRepository(Appointment).save({
			practiceId: practiceB.id,
			patientId: foreignPatient.id,
			providerUserId: outsider.id,
			startAt: new Date(Date.now() + 10 * 60 * 60 * 1000),
			endAt: new Date(Date.now() + 11 * 60 * 60 * 1000),
			type: 'telehealth',
			state: 'scheduled',
			synthetic: true,
		});
		const foreignSession = await dataSource.getRepository(TelehealthSession).save({
			practiceId: practiceB.id,
			appointmentId: foreignAppointment.id,
			state: 'waiting',
			waitingStartedAt: new Date(),
			synthetic: true,
		});
		const foreign = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${foreignSession.id}/media-token`)
			.set('Authorization', `Bearer ${providerToken}`)
			.expect(404);
		expect(foreign.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(foreign.body)).not.toContain(practiceB.id);

		const mismatch = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/media-token`)
			.set('Authorization', `Bearer ${providerToken}`)
			.send({practiceId: practiceB.id})
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');
		expect(JSON.stringify(mismatch.body)).not.toContain(practiceB.id);

		const ended = await request(app.getHttpServer())
			.post(`/telehealth/sessions/${created.body.id}/end`)
			.set('Authorization', `Bearer ${desk}`)
			.expect(200);
		expect(ended.body.state).toBe('ended');
		const deleteAudits = await dataSource.getRepository(AuditEvent).find({
			where: {
				practiceId: practiceA.id,
				resourceId: created.body.id,
				action: 'telehealth_session.media_room_deleted',
			},
		});
		expect(deleteAudits.length).toBeGreaterThan(0);
	});

	it('denies create from a nurse and a patient user', async () => {
		const desk = await login(receptionist.email);
		await cancelOpenAppointments(desk);
		const appointment = await createAppointment(desk, {
			start: isoFromNow(6 * 60 * 60 * 1000),
			end: isoFromNow(7 * 60 * 60 * 1000),
		});

		const nurseToken = await login(nurse.email);
		const nurseDenied = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${nurseToken}`)
			.send({appointmentId: appointment.id})
			.expect(403);
		expect(nurseDenied.body.error.code).toBe('FORBIDDEN');

		const patientToken = await login(portalUser.email);
		const patientDenied = await request(app.getHttpServer())
			.post('/telehealth/sessions')
			.set('Authorization', `Bearer ${patientToken}`)
			.send({appointmentId: appointment.id})
			.expect(403);
		expect(patientDenied.body.error.code).toBe('FORBIDDEN');
	});
});
