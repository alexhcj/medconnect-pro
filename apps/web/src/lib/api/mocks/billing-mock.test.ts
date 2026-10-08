import {ApiError} from '@/lib/api/http';
import {billingMockAPI} from '@/lib/api/mocks/billing-mock';

describe('billingMockAPI', () => {
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

	it('records a payment and marks the invoice paid', async () => {
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
	});

	it('lists labeled claim envelopes derived from invoices', async () => {
		const claims = await billingMockAPI.listClaims();
		expect(claims.length).toBeGreaterThan(0);
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
