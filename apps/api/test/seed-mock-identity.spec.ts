import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {DataSource} from 'typeorm';
import {AppModule} from '../src/app.module.js';
import {
	DEMO_EMAIL,
	LIVE_DEMO_MFA_NURSE_ID,
	LIVE_DEMO_PATIENT_ID,
	LIVE_DEMO_PROVIDER_ID,
	MFA_NURSE_EMAIL,
	PATIENT_EMAIL,
	PRACTICE_NAME,
	PROVIDER_EMAIL,
	seedMockIdentity,
} from '../src/identity/seed-mock-identity.js';
import {configureApp} from '../src/platform/configure-app.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {RATE_LIMIT_STORE} from '../src/rate-limit/rate-limit-store.js';
import {testRateLimitStore} from './rate-limit-test-store.js';
import {utcDateKey} from '../src/identity/seed-mock-identity-corpus.js';
import {Appointment} from '../src/persistence/entities/appointment.entity.js';
import {Invoice} from '../src/persistence/entities/invoice.entity.js';
import {Notification} from '../src/persistence/entities/notification.entity.js';
import {PatientAssignment} from '../src/persistence/entities/patient-assignment.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {createAdminDataSource} from './admin-data-source.js';

type HarborSnapshot = {
	patientCount: number;
	patientEmails: string[];
	appointmentCount: number;
	todayAppointmentCount: number;
	currentMonthInvoiceCount: number;
	adminInboxCount: number;
	providerInboxCount: number;
	nonSyntheticPatients: number;
	nonSyntheticAppointments: number;
	nonSyntheticInvoices: number;
	nonSyntheticNotifications: number;
};

describe('seed:mock-identity bounded corpus', () => {
	let dataSource: DataSource;

	beforeAll(async () => {
		dataSource = await createAdminDataSource();
	});

	afterAll(async () => {
		if (dataSource?.isInitialized) {
			await dataSource.destroy();
		}
	});

	async function snapshot(): Promise<HarborSnapshot> {
		const practice = await dataSource.getRepository(Practice).findOne({
			where: {name: PRACTICE_NAME},
		});
		expect(practice).toBeTruthy();
		const practiceId = practice!.id;
		const now = new Date();
		const today = utcDateKey(now);
		const monthPrefix = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

		const admin = await dataSource.getRepository(User).findOne({where: {email: DEMO_EMAIL}});
		const provider = await dataSource.getRepository(User).findOne({
			where: {email: PROVIDER_EMAIL},
		});
		expect(admin).toBeTruthy();
		expect(provider).toBeTruthy();

		const patientRows = await dataSource.getRepository(Patient).find({where: {practiceId}});
		const appointmentRows = await dataSource.getRepository(Appointment).find({where: {practiceId}});
		const invoiceRows = await dataSource.getRepository(Invoice).find({where: {practiceId}});
		const notificationRows = await dataSource.getRepository(Notification).find({
			where: {practiceId, channel: 'in_app'},
		});

		return {
			patientCount: patientRows.length,
			patientEmails: patientRows.map((row) => row.email).sort(),
			appointmentCount: appointmentRows.length,
			todayAppointmentCount: appointmentRows.filter(
				(row) => utcDateKey(row.startAt) === today,
			).length,
			currentMonthInvoiceCount: invoiceRows.filter((row) =>
				row.issuedAt.toISOString().startsWith(monthPrefix),
			).length,
			adminInboxCount: notificationRows.filter((row) => row.recipientUserId === admin!.id)
				.length,
			providerInboxCount: notificationRows.filter(
				(row) => row.recipientUserId === provider!.id,
			).length,
			nonSyntheticPatients: patientRows.filter((row) => !row.synthetic).length,
			nonSyntheticAppointments: appointmentRows.filter((row) => !row.synthetic).length,
			nonSyntheticInvoices: invoiceRows.filter((row) => !row.synthetic).length,
			nonSyntheticNotifications: notificationRows.filter((row) => !row.synthetic).length,
		};
	}

	it('meets Harbor minima and does not grow on a second run', async () => {
		await seedMockIdentity();
		const first = await snapshot();

		expect(first.patientCount).toBeGreaterThanOrEqual(20);
		expect(first.appointmentCount).toBeGreaterThanOrEqual(8);
		expect(first.todayAppointmentCount).toBeGreaterThanOrEqual(2);
		expect(first.currentMonthInvoiceCount).toBeGreaterThanOrEqual(4);
		expect(first.adminInboxCount).toBeGreaterThanOrEqual(3);
		expect(first.providerInboxCount).toBeGreaterThanOrEqual(2);
		expect(first.patientEmails).toContain('avery.quinn@synthetic.example');
		expect(first.patientEmails).toContain('blake.chen@synthetic.example');

		const mfaNurse = await dataSource.getRepository(User).findOne({
			where: {email: MFA_NURSE_EMAIL},
		});
		expect(mfaNurse).toBeTruthy();
		expect(mfaNurse!.id).toBe(LIVE_DEMO_MFA_NURSE_ID);
		const practice = await dataSource.getRepository(Practice).findOne({
			where: {name: PRACTICE_NAME},
		});
		expect(practice).toBeTruthy();
		const nurseMembership = await dataSource.getRepository(PracticeMembership).findOne({
			where: {practiceId: practice!.id, userId: mfaNurse!.id},
		});
		expect(nurseMembership?.role).toBe('NURSE');
		const avery = await dataSource.getRepository(Patient).findOne({
			where: {practiceId: practice!.id, email: 'avery.quinn@synthetic.example'},
		});
		expect(avery).toBeTruthy();
		const patientUser = await dataSource.getRepository(User).findOne({
			where: {email: PATIENT_EMAIL},
		});
		expect(patientUser).toBeTruthy();
		expect(patientUser!.id).toBe(LIVE_DEMO_PATIENT_ID);
		const patientMemberships = await dataSource.getRepository(PracticeMembership).find({
			where: {practiceId: practice!.id, userId: patientUser!.id},
		});
		expect(patientMemberships).toHaveLength(1);
		expect(patientMemberships[0]?.role).toBe('PATIENT');
		expect(avery!.portalUserId).toBe(patientUser!.id);
		const linked = await dataSource.getRepository(Patient).find({
			where: {practiceId: practice!.id, portalUserId: patientUser!.id},
		});
		expect(linked.map((row) => row.email)).toEqual([PATIENT_EMAIL]);
		const admin = await dataSource.getRepository(User).findOne({where: {email: DEMO_EMAIL}});
		const provider = await dataSource.getRepository(User).findOne({where: {email: PROVIDER_EMAIL}});
		expect(admin).toBeTruthy();
		expect(provider).toBeTruthy();
		const adminMembership = await dataSource.getRepository(PracticeMembership).findOne({
			where: {practiceId: practice!.id, userId: admin!.id},
		});
		expect(adminMembership?.role).toBe('PRACTICE_ADMIN');
		expect(provider!.id).toBe(LIVE_DEMO_PROVIDER_ID);
		const providerMembership = await dataSource.getRepository(PracticeMembership).findOne({
			where: {practiceId: practice!.id, userId: provider!.id},
		});
		expect(providerMembership?.role).toBe('PROVIDER');
		const nurseAssignment = await dataSource.getRepository(PatientAssignment).findOne({
			where: {patientId: avery!.id, userId: mfaNurse!.id},
		});
		expect(nurseAssignment).toBeTruthy();
		expect(new Set(first.patientEmails).size).toBe(first.patientEmails.length);
		expect(first.nonSyntheticPatients).toBe(0);
		expect(first.nonSyntheticAppointments).toBe(0);
		expect(first.nonSyntheticInvoices).toBe(0);
		expect(first.nonSyntheticNotifications).toBe(0);

		await seedMockIdentity();
		const second = await snapshot();

		expect(second.patientCount).toBe(first.patientCount);
		expect(second.appointmentCount).toBe(first.appointmentCount);
		expect(second.todayAppointmentCount).toBeGreaterThanOrEqual(2);
		expect(second.currentMonthInvoiceCount).toBe(first.currentMonthInvoiceCount);
		expect(second.adminInboxCount).toBe(first.adminInboxCount);
		expect(second.providerInboxCount).toBe(first.providerInboxCount);
		expect(second.patientEmails).toEqual(first.patientEmails);

		const patientUsers = await dataSource.getRepository(User).find({
			where: {email: PATIENT_EMAIL},
		});
		expect(patientUsers).toHaveLength(1);
		expect(patientUsers[0]?.id).toBe(LIVE_DEMO_PATIENT_ID);
		const membershipsAfter = await dataSource.getRepository(PracticeMembership).find({
			where: {practiceId: practice!.id, userId: LIVE_DEMO_PATIENT_ID},
		});
		expect(membershipsAfter).toHaveLength(1);
		expect(membershipsAfter[0]?.role).toBe('PATIENT');
		const averyAfter = await dataSource.getRepository(Patient).findOne({
			where: {practiceId: practice!.id, email: PATIENT_EMAIL},
		});
		expect(averyAfter?.portalUserId).toBe(LIVE_DEMO_PATIENT_ID);
		const adminAfter = await dataSource.getRepository(PracticeMembership).findOne({
			where: {practiceId: practice!.id, userId: admin!.id},
		});
		expect(adminAfter?.role).toBe('PRACTICE_ADMIN');
		const providerAfter = await dataSource.getRepository(PracticeMembership).findOne({
			where: {practiceId: practice!.id, userId: provider!.id},
		});
		expect(providerAfter?.role).toBe('PROVIDER');
		const nurseAfter = await dataSource.getRepository(PracticeMembership).findOne({
			where: {practiceId: practice!.id, userId: mfaNurse!.id},
		});
		expect(nurseAfter?.role).toBe('NURSE');
	});
});

describe('seeded patient portal login', {timeout: 60_000}, () => {
	let app: INestApplication;
	let dataSource: DataSource;

	beforeAll(async () => {
		await seedMockIdentity();
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(RATE_LIMIT_STORE)
			.useValue(testRateLimitStore)
			.compile();
		dataSource = await createAdminDataSource();
		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();
	});

	afterAll(async () => {
		if (dataSource?.isInitialized) {
			await dataSource.getRepository(AuthSession).delete({userId: LIVE_DEMO_PATIENT_ID});
		}
		await app?.close();
		if (dataSource?.isInitialized) {
			await dataSource.destroy();
		}
	});

	it('signs in without MFA and lists only Avery Quinn', async () => {
		const login = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email: PATIENT_EMAIL, password: 'Demo-Patient-1'})
			.expect(200);
		expect(login.body.mfaRequired).toBeUndefined();
		expect(typeof login.body.accessToken).toBe('string');
		expect(login.body.accessToken.length).toBeGreaterThan(0);

		const listed = await request(app.getHttpServer())
			.get('/patients')
			.set('Authorization', `Bearer ${login.body.accessToken as string}`)
			.expect(200);
		expect(listed.body.patients).toEqual([
			expect.objectContaining({
				email: PATIENT_EMAIL,
				firstName: 'Avery',
				lastName: 'Quinn',
			}),
		]);

		const practice = await dataSource.getRepository(Practice).findOne({
			where: {name: PRACTICE_NAME},
		});
		expect(practice).toBeTruthy();
		const blake = await dataSource.getRepository(Patient).findOne({
			where: {practiceId: practice!.id, email: 'blake.chen@synthetic.example'},
		});
		expect(blake).toBeTruthy();
		const denied = await request(app.getHttpServer())
			.get(`/patients/${blake!.id}`)
			.set('Authorization', `Bearer ${login.body.accessToken as string}`)
			.expect(404);
		expect(JSON.stringify(denied.body)).not.toContain('blake.chen@synthetic.example');
		expect(JSON.stringify(denied.body)).not.toContain('Blake');
	});
});
