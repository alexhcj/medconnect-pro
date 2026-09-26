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
});
