import {randomUUID} from 'node:crypto';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {DataSource, In} from 'typeorm';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {formatCount, formatCurrency} from '../src/dashboard/dashboard.access.js';
import {AppModule} from '../src/app.module.js';
import {defaultMockIdpAccounts, MOCK_IDP_USERS, type MockIdpAccount} from '../src/identity/mock-idp.js';
import {DEMO_EMAIL, PRACTICE_NAME, seedMockIdentity} from '../src/identity/seed-mock-identity.js';
import {utcDateKey} from '../src/identity/seed-mock-identity-corpus.js';
import {configureApp} from '../src/platform/configure-app.js';
import {Appointment} from '../src/persistence/entities/appointment.entity.js';
import {AuditEvent} from '../src/persistence/entities/audit-event.entity.js';
import {AuthSession} from '../src/persistence/entities/auth-session.entity.js';
import {InvoiceLineItem} from '../src/persistence/entities/invoice-line-item.entity.js';
import {Invoice} from '../src/persistence/entities/invoice.entity.js';
import {PatientAssignment} from '../src/persistence/entities/patient-assignment.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {syntheticPatientColumns} from './synthetic-patient.js';
import {createAdminDataSource} from './admin-data-source.js';
import {RATE_LIMIT_STORE} from '../src/rate-limit/rate-limit-store.js';
import {testRateLimitStore} from './rate-limit-test-store.js';

const password = 'Synthetic-Pass-1';

type OverviewBody = {
	synthetic: boolean;
	metrics: Array<{id: string; value: string; title: string}>;
};

function metricValue(body: OverviewBody, id: string): string | undefined {
	return body.metrics.find((metric) => metric.id === id)?.value;
}

function metricIds(body: OverviewBody): string[] {
	return body.metrics.map((metric) => metric.id);
}

describe('dashboard overview HTTP', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let practiceA: Practice;
	let practiceB: Practice;
	let practiceAdmin: User;
	let nurse: User;
	let provider: User;
	let portalUser: User;
	let outsider: User;
	const suffix = randomUUID().slice(0, 8);
	const now = new Date();
	const todayKey = utcDateKey(now);
	const todayMorning = new Date(`${todayKey}T00:30:00.000Z`);
	const todayNoon = new Date(`${todayKey}T12:00:00.000Z`);
	const tomorrowKey = utcDateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000));
	const upcomingStart = new Date(`${tomorrowKey}T16:00:00.000Z`);
	const monthIssuedAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 6, 12));
	const priorMonthIssuedAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 6, 12));

	beforeAll(async () => {
		const adminEmail = `dash.admin.${suffix}@synthetic.example`;
		const nurseEmail = `dash.nurse.${suffix}@synthetic.example`;
		const providerEmail = `dash.provider.${suffix}@synthetic.example`;
		const portalEmail = `dash.portal.${suffix}@synthetic.example`;
		const outsiderEmail = `dash.outsider.${suffix}@synthetic.example`;
		const catalog: MockIdpAccount[] = [
			...defaultMockIdpAccounts,
			{email: adminEmail, password, role: 'PRACTICE_ADMIN'},
			{email: nurseEmail, password, role: 'NURSE'},
			{email: providerEmail, password, role: 'PROVIDER'},
			{email: portalEmail, password, role: 'PATIENT'},
			{email: outsiderEmail, password, role: 'PRACTICE_ADMIN'},
		];

		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
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
			name: `Dashboard North ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Dashboard South ${suffix}`,
		});
		practiceAdmin = await dataSource.getRepository(User).save({email: adminEmail});
		nurse = await dataSource.getRepository(User).save({email: nurseEmail});
		provider = await dataSource.getRepository(User).save({email: providerEmail});
		portalUser = await dataSource.getRepository(User).save({email: portalEmail});
		outsider = await dataSource.getRepository(User).save({
			email: outsiderEmail,
		});
		await dataSource.getRepository(PracticeMembership).save([
			{practiceId: practiceA.id, userId: practiceAdmin.id, role: 'PRACTICE_ADMIN'},
			{practiceId: practiceA.id, userId: nurse.id, role: 'NURSE'},
			{practiceId: practiceA.id, userId: provider.id, role: 'PROVIDER'},
			{practiceId: practiceA.id, userId: portalUser.id, role: 'PATIENT'},
			{practiceId: practiceB.id, userId: outsider.id, role: 'PRACTICE_ADMIN'},
		]);

		const portalPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Avery',
				lastName: `Dash${suffix}`,
				email: `avery.dash.${suffix}@synthetic.example`,
			}),
			portalUserId: portalUser.id,
		});
		const otherPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Blake',
				lastName: `DashOther${suffix}`,
				email: `blake.dash.${suffix}@synthetic.example`,
			}),
		});
		const thirdPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Casey',
				lastName: `DashThird${suffix}`,
				email: `casey.dash.${suffix}@synthetic.example`,
			}),
		});
		const foreignPatients = await Promise.all(
			[0, 1, 2, 3, 4, 5, 6].map((index) =>
				dataSource.getRepository(Patient).save({
					practiceId: practiceB.id,
					...syntheticPatientColumns(outsider.id, {
						firstName: 'Foreign',
						lastName: `Dash${suffix}${index}`,
						email: `foreign.dash.${suffix}.${index}@synthetic.example`,
					}),
				}),
			),
		);

		await dataSource.getRepository(Appointment).save([
			{
				practiceId: practiceA.id,
				patientId: otherPatient.id,
				providerUserId: provider.id,
				startAt: todayMorning,
				endAt: new Date(todayMorning.getTime() + 45 * 60 * 1000),
				type: 'office_visit',
				state: 'scheduled',
				synthetic: true,
			},
			{
				practiceId: practiceA.id,
				patientId: thirdPatient.id,
				providerUserId: provider.id,
				startAt: todayNoon,
				endAt: new Date(todayNoon.getTime() + 45 * 60 * 1000),
				type: 'follow_up',
				state: 'scheduled',
				synthetic: true,
			},
			{
				practiceId: practiceA.id,
				patientId: otherPatient.id,
				providerUserId: provider.id,
				startAt: new Date(`${todayKey}T18:00:00.000Z`),
				endAt: new Date(`${todayKey}T19:00:00.000Z`),
				type: 'office_visit',
				state: 'cancelled',
				synthetic: true,
			},
			{
				practiceId: practiceA.id,
				patientId: portalPatient.id,
				providerUserId: provider.id,
				startAt: upcomingStart,
				endAt: new Date(upcomingStart.getTime() + 60 * 60 * 1000),
				type: 'office_visit',
				state: 'scheduled',
				synthetic: true,
			},
			{
				practiceId: practiceB.id,
				patientId: foreignPatients[0].id,
				providerUserId: outsider.id,
				startAt: todayNoon,
				endAt: new Date(todayNoon.getTime() + 45 * 60 * 1000),
				type: 'office_visit',
				state: 'scheduled',
				synthetic: true,
			},
		]);

		const currentIssued = await dataSource.getRepository(Invoice).save({
			practiceId: practiceA.id,
			patientId: otherPatient.id,
			status: 'issued',
			amountCents: 12000,
			currency: 'USD',
			issuedAt: monthIssuedAt,
			dueAt: new Date(monthIssuedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
			synthetic: true,
		});
		const currentPaid = await dataSource.getRepository(Invoice).save({
			practiceId: practiceA.id,
			patientId: thirdPatient.id,
			status: 'paid',
			amountCents: 8000,
			currency: 'USD',
			issuedAt: monthIssuedAt,
			dueAt: new Date(monthIssuedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
			synthetic: true,
		});
		const priorMonth = await dataSource.getRepository(Invoice).save({
			practiceId: practiceA.id,
			patientId: otherPatient.id,
			status: 'issued',
			amountCents: 99000,
			currency: 'USD',
			issuedAt: priorMonthIssuedAt,
			dueAt: new Date(priorMonthIssuedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
			synthetic: true,
		});
		const portalOpen = await dataSource.getRepository(Invoice).save({
			practiceId: practiceA.id,
			patientId: portalPatient.id,
			status: 'issued',
			amountCents: 15000,
			currency: 'USD',
			issuedAt: priorMonthIssuedAt,
			dueAt: new Date(priorMonthIssuedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
			synthetic: true,
		});
		const portalPaid = await dataSource.getRepository(Invoice).save({
			practiceId: practiceA.id,
			patientId: portalPatient.id,
			status: 'paid',
			amountCents: 4000,
			currency: 'USD',
			issuedAt: priorMonthIssuedAt,
			dueAt: new Date(priorMonthIssuedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
			synthetic: true,
		});
		const foreignInvoice = await dataSource.getRepository(Invoice).save({
			practiceId: practiceB.id,
			patientId: foreignPatients[0].id,
			status: 'issued',
			amountCents: 88000,
			currency: 'USD',
			issuedAt: monthIssuedAt,
			dueAt: new Date(monthIssuedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
			synthetic: true,
		});
		await dataSource.getRepository(InvoiceLineItem).save([
			{
				practiceId: practiceA.id,
				invoiceId: currentIssued.id,
				description: 'Office visit',
				amountCents: 12000,
			},
			{
				practiceId: practiceA.id,
				invoiceId: currentPaid.id,
				description: 'Paid visit',
				amountCents: 8000,
			},
			{
				practiceId: practiceA.id,
				invoiceId: priorMonth.id,
				description: 'Prior month',
				amountCents: 99000,
			},
			{
				practiceId: practiceA.id,
				invoiceId: portalOpen.id,
				description: 'Portal balance',
				amountCents: 15000,
			},
			{
				practiceId: practiceA.id,
				invoiceId: portalPaid.id,
				description: 'Portal paid',
				amountCents: 4000,
			},
			{
				practiceId: practiceB.id,
				invoiceId: foreignInvoice.id,
				description: 'Foreign visit',
				amountCents: 88000,
			},
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
				{email: practiceAdmin?.email},
				{email: nurse?.email},
				{email: provider?.email},
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
			await dataSource.getRepository(InvoiceLineItem).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(Invoice).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(Appointment).delete({practiceId: In(practiceIds)});
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

	async function login(email: string, loginPassword = password): Promise<string> {
		const response = await request(app.getHttpServer())
			.post('/auth/login')
			.send({email, password: loginPassword})
			.expect(200);
		return response.body.accessToken as string;
	}

	it('rejects anonymous access and client practiceId mismatch', async () => {
		const anonymous = await request(app.getHttpServer()).get('/dashboard/overview').expect(401);
		expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

		const token = await login(practiceAdmin.email);
		const mismatch = await request(app.getHttpServer())
			.get('/dashboard/overview')
			.query({practiceId: practiceB.id})
			.set('Authorization', `Bearer ${token}`)
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');
	});

	it('returns honest practice-admin aggregates without marketing census or satisfaction', async () => {
		const token = await login(practiceAdmin.email);
		const response = await request(app.getHttpServer())
			.get('/dashboard/overview')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		const body = response.body as OverviewBody;
		expect(body.synthetic).toBe(true);
		expect(metricIds(body)).toEqual(['total_patients', 'todays_appointments', 'monthly_revenue']);
		expect(metricValue(body, 'total_patients')).toBe(formatCount(3));
		expect(metricValue(body, 'todays_appointments')).toBe(formatCount(2));
		expect(metricValue(body, 'monthly_revenue')).toBe(formatCurrency(20000));
		expect(JSON.stringify(body)).not.toContain('patient_satisfaction');
		expect(JSON.stringify(body)).not.toContain('2,834');
		expect(JSON.stringify(body)).not.toMatch(/Avery|Blake|Casey|@synthetic/);
	});

	it('omits monthly revenue for NURSE and PROVIDER', async () => {
		const nurseToken = await login(nurse.email);
		const nurseBody = (
			await request(app.getHttpServer())
				.get('/dashboard/overview')
				.set('Authorization', `Bearer ${nurseToken}`)
				.expect(200)
		).body as OverviewBody;
		expect(metricIds(nurseBody)).toEqual(['total_patients', 'todays_appointments']);
		expect(metricValue(nurseBody, 'total_patients')).toBe(formatCount(3));

		const providerToken = await login(provider.email);
		const providerBody = (
			await request(app.getHttpServer())
				.get('/dashboard/overview')
				.set('Authorization', `Bearer ${providerToken}`)
				.expect(200)
		).body as OverviewBody;
		expect(metricIds(providerBody)).toEqual(['total_patients', 'todays_appointments']);
	});

	it('returns self-scope PATIENT cards only', async () => {
		const token = await login(portalUser.email);
		const body = (
			await request(app.getHttpServer())
				.get('/dashboard/overview')
				.set('Authorization', `Bearer ${token}`)
				.expect(200)
		).body as OverviewBody;
		expect(metricIds(body)).toEqual(['upcoming_visits', 'open_balance']);
		expect(metricValue(body, 'upcoming_visits')).toBe(formatCount(1));
		expect(metricValue(body, 'open_balance')).toBe(formatCurrency(15000));
		expect(metricIds(body)).not.toContain('total_patients');
		expect(metricIds(body)).not.toContain('monthly_revenue');
	});

	it('does not leak cross-tenant census or revenue', async () => {
		const token = await login(outsider.email);
		const body = (
			await request(app.getHttpServer())
				.get('/dashboard/overview')
				.set('Authorization', `Bearer ${token}`)
				.expect(200)
		).body as OverviewBody;
		expect(metricValue(body, 'total_patients')).toBe(formatCount(7));
		expect(metricValue(body, 'todays_appointments')).toBe(formatCount(1));
		expect(metricValue(body, 'monthly_revenue')).toBe(formatCurrency(88000));
	});

	it('matches Harbor DATA-002 seed counts for the practice admin', async () => {
		await seedMockIdentity();
		const harbor = await dataSource.getRepository(Practice).findOne({where: {name: PRACTICE_NAME}});
		expect(harbor).toBeTruthy();
		const patients = await dataSource.getRepository(Patient).find({where: {practiceId: harbor!.id}});
		const appointments = await dataSource
			.getRepository(Appointment)
			.find({where: {practiceId: harbor!.id}});
		const invoices = await dataSource.getRepository(Invoice).find({where: {practiceId: harbor!.id}});
		const monthPrefix = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
		const todayCount = appointments.filter(
			(row) => utcDateKey(row.startAt) === todayKey && row.state !== 'cancelled',
		).length;
		const monthCents = invoices
			.filter((row) => row.issuedAt.toISOString().startsWith(monthPrefix))
			.reduce((sum, row) => sum + row.amountCents, 0);
		const adminAccount = defaultMockIdpAccounts.find((account) => account.email === DEMO_EMAIL);
		expect(adminAccount).toBeTruthy();

		const token = await login(DEMO_EMAIL, adminAccount!.password);
		const body = (
			await request(app.getHttpServer())
				.get('/dashboard/overview')
				.set('Authorization', `Bearer ${token}`)
				.expect(200)
		).body as OverviewBody;
		expect(metricValue(body, 'total_patients')).toBe(formatCount(patients.length));
		expect(metricValue(body, 'todays_appointments')).toBe(formatCount(todayCount));
		expect(metricValue(body, 'monthly_revenue')).toBe(formatCurrency(monthCents));
		expect(patients.length).toBeGreaterThanOrEqual(20);
		expect(todayCount).toBeGreaterThanOrEqual(2);
	});
});
