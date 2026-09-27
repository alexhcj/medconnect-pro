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
import {InvoiceLineItem} from '../src/persistence/entities/invoice-line-item.entity.js';
import {Invoice} from '../src/persistence/entities/invoice.entity.js';
import {PatientAssignment} from '../src/persistence/entities/patient-assignment.entity.js';
import {Patient} from '../src/persistence/entities/patient.entity.js';
import {Payment} from '../src/persistence/entities/payment.entity.js';
import {PracticeMembership} from '../src/persistence/entities/practice-membership.entity.js';
import {Practice} from '../src/persistence/entities/practice.entity.js';
import {User} from '../src/persistence/entities/user.entity.js';
import {syntheticPatientColumns} from './synthetic-patient.js';
import {createAdminDataSource} from './admin-data-source.js';

const password = 'Synthetic-Pass-1';

describe('billing HTTP', () => {
	let app: INestApplication;
	let dataSource: DataSource;
	let practiceA: Practice;
	let practiceB: Practice;
	let receptionist: User;
	let practiceAdmin: User;
	let provider: User;
	let nurse: User;
	let portalUser: User;
	let outsider: User;
	let patient: Patient;
	let otherPatient: Patient;
	let foreignPatient: Patient;
	const suffix = randomUUID().slice(0, 8);

	beforeAll(async () => {
		const receptionistEmail = `bill.receptionist.${suffix}@synthetic.example`;
		const adminEmail = `bill.admin.${suffix}@synthetic.example`;
		const providerEmail = `bill.provider.${suffix}@synthetic.example`;
		const nurseEmail = `bill.nurse.${suffix}@synthetic.example`;
		const portalEmail = `bill.portal.${suffix}@synthetic.example`;
		const catalog: MockIdpAccount[] = [
			{email: receptionistEmail, password, role: 'RECEPTIONIST'},
			{email: adminEmail, password, role: 'PRACTICE_ADMIN'},
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
			name: `Billing North ${suffix}`,
		});
		practiceB = await dataSource.getRepository(Practice).save({
			name: `Billing South ${suffix}`,
		});
		receptionist = await dataSource.getRepository(User).save({email: receptionistEmail});
		practiceAdmin = await dataSource.getRepository(User).save({email: adminEmail});
		provider = await dataSource.getRepository(User).save({email: providerEmail});
		nurse = await dataSource.getRepository(User).save({email: nurseEmail});
		portalUser = await dataSource.getRepository(User).save({email: portalEmail});
		outsider = await dataSource.getRepository(User).save({
			email: `bill.outsider.${suffix}@synthetic.example`,
		});
		await dataSource.getRepository(PracticeMembership).save([
			{practiceId: practiceA.id, userId: receptionist.id, role: 'RECEPTIONIST'},
			{practiceId: practiceA.id, userId: practiceAdmin.id, role: 'PRACTICE_ADMIN'},
			{practiceId: practiceA.id, userId: provider.id, role: 'PROVIDER'},
			{practiceId: practiceA.id, userId: nurse.id, role: 'NURSE'},
			{practiceId: practiceA.id, userId: portalUser.id, role: 'PATIENT'},
			{practiceId: practiceB.id, userId: outsider.id, role: 'PROVIDER'},
		]);
		patient = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Avery',
				lastName: `Bill${suffix}`,
				email: `avery.bill.${suffix}@synthetic.example`,
			}),
			portalUserId: portalUser.id,
		});
		otherPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceA.id,
			...syntheticPatientColumns(provider.id, {
				firstName: 'Blake',
				lastName: `OtherBill${suffix}`,
				email: `blake.bill.${suffix}@synthetic.example`,
			}),
		});
		foreignPatient = await dataSource.getRepository(Patient).save({
			practiceId: practiceB.id,
			...syntheticPatientColumns(outsider.id, {
				firstName: 'Casey',
				lastName: `ForeignBill${suffix}`,
				email: `foreign.bill.${suffix}@synthetic.example`,
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
				{email: practiceAdmin?.email},
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
			await dataSource.getRepository(Payment).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(InvoiceLineItem).delete({practiceId: In(practiceIds)});
			await dataSource.getRepository(Invoice).delete({practiceId: In(practiceIds)});
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

	function invoiceBody(overrides: Record<string, unknown> = {}) {
		return {
			patientId: patient.id,
			dueAt: '2027-01-15T00:00:00.000Z',
			lineItems: [{description: 'Office visit', amountCents: 15000}],
			...overrides,
		};
	}

	it('rejects anonymous access and card fields on create', async () => {
		const anonymous = await request(app.getHttpServer()).get('/billing/invoices').expect(401);
		expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

		const token = await login(receptionist.email);
		const invalid = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.send({
				...invoiceBody(),
				cardNumber: '4111111111111111',
				cvv: '123',
			})
			.expect(400);
		expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
		expect(JSON.stringify(invalid.body)).not.toMatch(/4111111111111111|stack|password/i);
	});

	it('lets a receptionist create, list, and get invoices and records audit without PHI', async () => {
		const token = await login(receptionist.email);
		const created = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.set('X-Correlation-ID', `cid-bill-create-${suffix}`)
			.send(invoiceBody())
			.expect(201);
		expect(created.body.synthetic).toBe(true);
		expect(created.body.status).toBe('issued');
		expect(created.body.amountCents).toBe(15000);
		expect(created.body.patientName).toContain('Avery');
		expect(created.body.practiceId).toBe(practiceA.id);
		expect(created.body.lineItems).toEqual([{description: 'Office visit', amountCents: 15000}]);

		const listed = await request(app.getHttpServer())
			.get('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listed.body.invoices.some((row: {id: string}) => row.id === created.body.id)).toBe(true);

		const got = await request(app.getHttpServer())
			.get(`/billing/invoices/${created.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(got.body.id).toBe(created.body.id);

		const audits = await dataSource.getRepository(AuditEvent).find({
			where: {practiceId: practiceA.id, resourceId: created.body.id, action: 'invoice.created'},
		});
		expect(audits.length).toBeGreaterThan(0);
		expect(JSON.stringify(audits[0])).not.toMatch(/15000|Office visit|Avery|Quinn|PAN|4111/i);
		expect(audits[0]?.correlationId).toBe(`cid-bill-create-${suffix}`);
	});

	it('lets a practice admin create invoices', async () => {
		const token = await login(practiceAdmin.email);
		const created = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.send(invoiceBody({lineItems: [{description: 'Follow-up visit', amountCents: 9500}]}))
			.expect(201);
		expect(created.body.amountCents).toBe(9500);
	});

	it('lets a provider read invoices and denies create and payment', async () => {
		const desk = await login(receptionist.email);
		const created = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${desk}`)
			.send(invoiceBody({lineItems: [{description: 'Lab panel', amountCents: 4000}]}))
			.expect(201);

		const token = await login(provider.email);
		const listed = await request(app.getHttpServer())
			.get('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listed.body.invoices.some((row: {id: string}) => row.id === created.body.id)).toBe(true);

		const deniedCreate = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.send(invoiceBody())
			.expect(403);
		expect(deniedCreate.body.error.code).toBe('FORBIDDEN');

		const deniedPay = await request(app.getHttpServer())
			.post('/billing/payments')
			.set('Authorization', `Bearer ${token}`)
			.send({invoiceId: created.body.id, method: 'stripe'})
			.expect(403);
		expect(deniedPay.body.error.code).toBe('FORBIDDEN');
	});

	it('denies nurse list, get, create, payment, and claims', async () => {
		const desk = await login(receptionist.email);
		const created = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${desk}`)
			.send(invoiceBody({lineItems: [{description: 'Nurse deny', amountCents: 1000}]}))
			.expect(201);

		const token = await login(nurse.email);
		const listed = await request(app.getHttpServer())
			.get('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.expect(403);
		expect(listed.body.error.code).toBe('FORBIDDEN');

		const got = await request(app.getHttpServer())
			.get(`/billing/invoices/${created.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(403);
		expect(got.body.error.code).toBe('FORBIDDEN');

		const createdDenied = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.send(invoiceBody())
			.expect(403);
		expect(createdDenied.body.error.code).toBe('FORBIDDEN');

		const paid = await request(app.getHttpServer())
			.post('/billing/payments')
			.set('Authorization', `Bearer ${token}`)
			.send({invoiceId: created.body.id, method: 'ach'})
			.expect(403);
		expect(paid.body.error.code).toBe('FORBIDDEN');

		const claims = await request(app.getHttpServer())
			.get('/billing/claims')
			.set('Authorization', `Bearer ${token}`)
			.expect(403);
		expect(claims.body.error.code).toBe('FORBIDDEN');
	});

	it('lets a portal user read and pay their own invoice and hides another patient’s', async () => {
		const desk = await login(receptionist.email);
		const own = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${desk}`)
			.send(invoiceBody({lineItems: [{description: 'Portal visit', amountCents: 8000}]}))
			.expect(201);
		const other = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${desk}`)
			.send(
				invoiceBody({
					patientId: otherPatient.id,
					lineItems: [{description: 'Other visit', amountCents: 5000}],
				}),
			)
			.expect(201);

		const token = await login(portalUser.email);
		const listed = await request(app.getHttpServer())
			.get('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(listed.body.invoices.some((row: {id: string}) => row.id === own.body.id)).toBe(true);
		expect(listed.body.invoices.some((row: {id: string}) => row.id === other.body.id)).toBe(false);

		const hidden = await request(app.getHttpServer())
			.get(`/billing/invoices/${other.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(hidden.body.error.code).toBe('NOT_FOUND');

		const createDenied = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.send(invoiceBody())
			.expect(403);
		expect(createDenied.body.error.code).toBe('FORBIDDEN');

		const paid = await request(app.getHttpServer())
			.post('/billing/payments')
			.set('Authorization', `Bearer ${token}`)
			.set('X-Correlation-ID', `cid-bill-pay-${suffix}`)
			.send({invoiceId: own.body.id, method: 'stripe'})
			.expect(201);
		expect(paid.body.status).toBe('recorded');
		expect(paid.body.processorRef).toMatch(/^demo_/);
		expect(JSON.stringify(paid.body)).not.toMatch(/cardNumber|cvv|4111/i);

		const refreshed = await request(app.getHttpServer())
			.get(`/billing/invoices/${own.body.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		expect(refreshed.body.status).toBe('paid');

		const paymentAudits = await dataSource.getRepository(AuditEvent).find({
			where: {practiceId: practiceA.id, resourceId: paid.body.id, action: 'payment.recorded'},
		});
		expect(paymentAudits.length).toBeGreaterThan(0);
		expect(JSON.stringify(paymentAudits[0])).not.toMatch(/8000|Portal visit|Avery|4111/i);
	});

	it('conflicts when paying an already paid invoice', async () => {
		const desk = await login(receptionist.email);
		const created = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${desk}`)
			.send(invoiceBody({lineItems: [{description: 'Paid once', amountCents: 2000}]}))
			.expect(201);
		await request(app.getHttpServer())
			.post('/billing/payments')
			.set('Authorization', `Bearer ${desk}`)
			.send({invoiceId: created.body.id, method: 'ach'})
			.expect(201);
		const again = await request(app.getHttpServer())
			.post('/billing/payments')
			.set('Authorization', `Bearer ${desk}`)
			.send({invoiceId: created.body.id, method: 'ach'})
			.expect(409);
		expect(again.body.error.code).toBe('INVOICE_ALREADY_PAID');
	});

	it('hides a cross-tenant invoice and rejects a client practice id', async () => {
		const foreignInvoice = await dataSource.getRepository(Invoice).save({
			practiceId: practiceB.id,
			patientId: foreignPatient.id,
			status: 'issued',
			amountCents: 22000,
			currency: 'USD',
			issuedAt: new Date('2026-09-08T00:00:00.000Z'),
			dueAt: new Date('2026-09-22T00:00:00.000Z'),
			synthetic: true,
		});
		await dataSource.getRepository(InvoiceLineItem).save({
			practiceId: practiceB.id,
			invoiceId: foreignInvoice.id,
			description: 'Office visit',
			amountCents: 22000,
		});

		const token = await login(receptionist.email);
		const missing = await request(app.getHttpServer())
			.get(`/billing/invoices/${foreignInvoice.id}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
		expect(missing.body.error.code).toBe('NOT_FOUND');
		expect(JSON.stringify(missing.body)).not.toContain(practiceB.id);

		const mismatch = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.send(invoiceBody({practiceId: practiceB.id}))
			.expect(403);
		expect(mismatch.body.error.code).toBe('FORBIDDEN');
		expect(JSON.stringify(mismatch.body)).not.toContain(practiceB.id);
	});

	it('lists labeled claims envelopes for visible invoices', async () => {
		const token = await login(receptionist.email);
		const created = await request(app.getHttpServer())
			.post('/billing/invoices')
			.set('Authorization', `Bearer ${token}`)
			.send(invoiceBody({lineItems: [{description: 'Claim visit', amountCents: 3000}]}))
			.expect(201);
		const claims = await request(app.getHttpServer())
			.get('/billing/claims')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
		const match = claims.body.claims.find((row: {invoiceId: string}) => row.invoiceId === created.body.id);
		expect(match).toMatchObject({
			id: created.body.id,
			invoiceId: created.body.id,
			status: 'not_submitted',
			processor: 'edi837',
			synthetic: true,
		});
		expect(JSON.stringify(claims.body)).not.toMatch(/ISA\*|GS\*|CLM\*/);
	});
});
