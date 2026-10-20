import {ApiError} from '@/lib/api/http';
import {
	billingMockAPI,
	canRecordMockPayment,
	MOCK_PORTAL_PATIENT_BY_USER,
	resolveMockBillingScope,
} from '@/lib/api/mocks/billing-mock';
import {clearMockSession, writeMockSession} from '@/lib/api/mocks/mock-session-store';
import {sessionMockFactories} from '@/lib/api/mocks/session-mock';
import type {Role} from '@/types/auth/roles';

const PORTAL_USER_ID = '77777777-7777-4777-8777-777777777777';

function signInAs(role: Role, userId = `user_mock_${role.toLowerCase()}`) {
	writeMockSession(sessionMockFactories.createMockSession({userRole: role, userId}));
}

describe('billingMockAPI', () => {
	afterEach(() => {
		clearMockSession();
	});

	describe('practice-wide roles', () => {
		beforeEach(() => signInAs('PRACTICE_ADMIN'));

		it('lists synthetic invoices with patient display names', async () => {
			const invoices = await billingMockAPI.listInvoices();

			expect(invoices.length).toBeGreaterThan(0);
			expect(invoices[0]).toEqual(
				expect.objectContaining({
					id: 'demo-invoice-001',
					patientId: 'demo-patient-001',
					patientName: 'Avery Carter',
					status: 'issued',
					amountCents: 15000,
					synthetic: true,
				}),
			);
			expect(invoices.some((invoice) => invoice.status === 'paid')).toBe(true);
			expect(invoices.some((invoice) => invoice.status === 'overdue')).toBe(true);
			expect(new Set(invoices.map((invoice) => invoice.patientId)).size).toBeGreaterThan(1);
		});

		it('returns a single invoice by id', async () => {
			const invoice = await billingMockAPI.getInvoice('demo-invoice-002');
			expect(invoice).toMatchObject({
				id: 'demo-invoice-002',
				patientName: 'Taylor Bennett',
				status: 'paid',
				amountCents: 8000,
			});
		});

		it('rejects an unknown invoice id', async () => {
			await expect(billingMockAPI.getInvoice('demo-invoice-missing')).rejects.toMatchObject({
				status: 404,
				code: 'NOT_FOUND',
			});
			await expect(billingMockAPI.getInvoice('demo-invoice-missing')).rejects.toBeInstanceOf(ApiError);
		});

		it('records a payment and the invoice reads as paid after refetch', async () => {
			const payment = await billingMockAPI.recordPayment({
				invoiceId: 'demo-invoice-004',
				method: 'stripe',
			});
			expect(payment).toMatchObject({
				invoiceId: 'demo-invoice-004',
				method: 'stripe',
				status: 'recorded',
				synthetic: true,
			});
			expect(payment.processorRef.startsWith('demo_')).toBe(true);
			await expect(billingMockAPI.getInvoice('demo-invoice-004')).resolves.toMatchObject({status: 'paid'});
			const list = await billingMockAPI.listInvoices();
			expect(list.find((invoice) => invoice.id === 'demo-invoice-004')?.status).toBe('paid');
		});

		it('returns copies, so a fetched invoice does not change in place after a payment', async () => {
			const fetched = await billingMockAPI.getInvoice('demo-invoice-001');
			const listed = (await billingMockAPI.listInvoices()).find((invoice) => invoice.id === 'demo-invoice-001');
			expect(fetched.status).toBe('issued');

			await billingMockAPI.recordPayment({invoiceId: 'demo-invoice-001', method: 'ach'});

			expect(fetched.status).toBe('issued');
			expect(listed?.status).toBe('issued');
			expect(await billingMockAPI.getInvoice('demo-invoice-001')).not.toBe(fetched);
			await expect(billingMockAPI.getInvoice('demo-invoice-001')).resolves.toMatchObject({status: 'paid'});
		});

		it('lists labeled claim envelopes derived from all invoices', async () => {
			const [claims, invoices] = await Promise.all([
				billingMockAPI.listClaims(),
				billingMockAPI.listInvoices(),
			]);
			expect(claims).toHaveLength(invoices.length);
			expect(claims[0]).toEqual(
				expect.objectContaining({
					id: 'demo-invoice-001',
					invoiceId: 'demo-invoice-001',
					status: 'not_submitted',
					processor: 'edi837',
					synthetic: true,
				}),
			);
			expect(claims.every((claim) => claim.status === 'not_submitted')).toBe(true);
			expect(claims.every((claim) => claim.processor === 'edi837')).toBe(true);
		});

		it('conflicts when the mock invoice is already paid', async () => {
			await expect(
				billingMockAPI.recordPayment({invoiceId: 'demo-invoice-002', method: 'ach'}),
			).rejects.toMatchObject({
				status: 409,
				code: 'INVOICE_ALREADY_PAID',
			});
		});
	});

	describe.each<Role>(['SUPER_ADMIN', 'PRACTICE_ADMIN', 'PROVIDER', 'RECEPTIONIST'])(
		'%s has practice-wide read scope',
		(role) => {
			it('lists every invoice and claim', async () => {
				signInAs(role);
				const all = await billingMockAPI.listInvoices();
				const claims = await billingMockAPI.listClaims();
				expect(new Set(all.map((invoice) => invoice.patientId)).size).toBeGreaterThan(1);
				expect(claims).toHaveLength(all.length);
				await expect(billingMockAPI.getInvoice('demo-invoice-002')).resolves.toMatchObject({
					patientId: 'demo-patient-004',
				});
			});
		},
	);

	describe('patient (own scope)', () => {
		beforeEach(() => signInAs('PATIENT', PORTAL_USER_ID));

		it('lists only invoices linked to the portal patient', async () => {
			const invoices = await billingMockAPI.listInvoices();

			expect(invoices.length).toBeGreaterThan(0);
			expect(invoices.every((invoice) => invoice.patientId === 'demo-patient-001')).toBe(true);
			expect(invoices.map((invoice) => invoice.id)).toEqual(
				expect.arrayContaining(['demo-invoice-001', 'demo-invoice-003']),
			);
			expect(invoices.some((invoice) => invoice.patientName === 'Taylor Bennett')).toBe(false);
		});

		it('scopes the claims envelopes to the same invoices', async () => {
			const [claims, invoices] = await Promise.all([
				billingMockAPI.listClaims(),
				billingMockAPI.listInvoices(),
			]);
			expect(claims.map((claim) => claim.invoiceId).sort()).toEqual(
				invoices.map((invoice) => invoice.id).sort(),
			);
		});

		it('returns an own invoice', async () => {
			await expect(billingMockAPI.getInvoice('demo-invoice-001')).resolves.toMatchObject({
				id: 'demo-invoice-001',
				patientId: 'demo-patient-001',
			});
		});

		it("returns not-found for another patient's invoice, as the API does", async () => {
			await expect(billingMockAPI.getInvoice('demo-invoice-002')).rejects.toMatchObject({
				status: 404,
				code: 'NOT_FOUND',
			});
		});

		it("returns not-found when paying another patient's invoice, not 409, and changes nothing", async () => {
			signInAs('PRACTICE_ADMIN');
			const before = (await billingMockAPI.getInvoice('demo-invoice-002')).status;
			signInAs('PATIENT', PORTAL_USER_ID);
			await expect(
				billingMockAPI.recordPayment({invoiceId: 'demo-invoice-002', method: 'stripe'}),
			).rejects.toMatchObject({status: 404, code: 'NOT_FOUND'});
			signInAs('PRACTICE_ADMIN');
			await expect(billingMockAPI.getInvoice('demo-invoice-002')).resolves.toMatchObject({status: before});
		});

		it('lets the patient pay an own invoice and staff see it as paid after refetch', async () => {
			await billingMockAPI.recordPayment({invoiceId: 'demo-invoice-003', method: 'ach'});
			await expect(billingMockAPI.getInvoice('demo-invoice-003')).resolves.toMatchObject({status: 'paid'});
			signInAs('RECEPTIONIST');
			const list = await billingMockAPI.listInvoices();
			expect(list.find((invoice) => invoice.id === 'demo-invoice-003')?.status).toBe('paid');
		});

		it('sees nothing for a portal user without a linked patient', async () => {
			signInAs('PATIENT', 'user_mock_unlinked_patient');
			await expect(billingMockAPI.listInvoices()).resolves.toEqual([]);
			await expect(billingMockAPI.listClaims()).resolves.toEqual([]);
			await expect(billingMockAPI.getInvoice('demo-invoice-001')).rejects.toMatchObject({status: 404});
		});
	});

	describe('nurse and provider', () => {
		it('denies a nurse billing reads and payments with 403', async () => {
			signInAs('NURSE');
			await expect(billingMockAPI.listInvoices()).rejects.toMatchObject({status: 403, code: 'FORBIDDEN'});
			await expect(billingMockAPI.listClaims()).rejects.toMatchObject({status: 403});
			await expect(billingMockAPI.getInvoice('demo-invoice-001')).rejects.toMatchObject({status: 403});
			await expect(
				billingMockAPI.recordPayment({invoiceId: 'demo-invoice-001', method: 'stripe'}),
			).rejects.toMatchObject({status: 403});
		});

		it('lets a provider read practice-wide but not record a payment', async () => {
			signInAs('PROVIDER');
			await expect(billingMockAPI.listInvoices()).resolves.not.toHaveLength(0);
			await expect(
				billingMockAPI.recordPayment({invoiceId: 'demo-invoice-001', method: 'stripe'}),
			).rejects.toMatchObject({status: 403, code: 'FORBIDDEN'});
		});
	});

	it('rejects every call without a mock session', async () => {
		await expect(billingMockAPI.listInvoices()).rejects.toMatchObject({status: 401});
		await expect(billingMockAPI.listClaims()).rejects.toMatchObject({status: 401});
		await expect(billingMockAPI.getInvoice('demo-invoice-001')).rejects.toMatchObject({status: 401});
		await expect(
			billingMockAPI.recordPayment({invoiceId: 'demo-invoice-001', method: 'stripe'}),
		).rejects.toMatchObject({status: 401});
	});
});

describe('mock billing scope rules', () => {
	// Same role cases as apps/api/src/billing/billing-access.spec.ts, to catch mock/API drift.
	it.each<[Role, 'practice' | 'own' | 'denied']>([
		['SUPER_ADMIN', 'practice'],
		['PRACTICE_ADMIN', 'practice'],
		['PROVIDER', 'practice'],
		['RECEPTIONIST', 'practice'],
		['PATIENT', 'own'],
		['NURSE', 'denied'],
	])('%s resolves to %s', (role, expected) => {
		const scope = resolveMockBillingScope(role, PORTAL_USER_ID);
		expect(scope === 'denied' ? scope : scope.kind).toBe(expected);
	});

	it('links the mock IdP patient to the Avery Carter fixture patient', () => {
		expect(MOCK_PORTAL_PATIENT_BY_USER[PORTAL_USER_ID]).toBe('demo-patient-001');
		expect(resolveMockBillingScope('PATIENT', PORTAL_USER_ID)).toEqual({
			kind: 'own',
			patientId: 'demo-patient-001',
		});
	});

	it.each<[Role, boolean]>([
		['SUPER_ADMIN', true],
		['PRACTICE_ADMIN', true],
		['RECEPTIONIST', true],
		['PATIENT', true],
		['PROVIDER', false],
		['NURSE', false],
	])('%s can record payment: %s', (role, expected) => {
		expect(canRecordMockPayment(role)).toBe(expected);
	});
});
