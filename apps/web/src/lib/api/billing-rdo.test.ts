import {describe, expect, it} from 'vitest';
import {invoiceFromRdo, type InvoiceRdo} from '@/lib/api/billing-rdo';
import {canAccessBillingDashboard} from '@/lib/auth/billing-access';

const rdo: InvoiceRdo = {
	id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
	practiceId: '22222222-2222-4222-8222-222222222222',
	patientId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
	patientName: 'Avery Quinn',
	status: 'overdue',
	amountCents: 15000,
	currency: 'USD',
	issuedAt: '2026-09-01T00:00:00.000Z',
	dueAt: '2026-09-15T00:00:00.000Z',
	lineItems: [{description: 'Office visit', amountCents: 15000}],
	synthetic: true,
};

describe('invoiceFromRdo', () => {
	it('maps InvoiceRdo onto the UI invoice without deriving status', () => {
		expect(invoiceFromRdo(rdo)).toEqual({
			id: rdo.id,
			practiceId: rdo.practiceId,
			patientId: rdo.patientId,
			patientName: 'Avery Quinn',
			status: 'overdue',
			amountCents: 15000,
			currency: 'USD',
			issuedAt: rdo.issuedAt,
			dueAt: rdo.dueAt,
			lineItems: [{description: 'Office visit', amountCents: 15000}],
			synthetic: true,
		});
	});

	it('keeps practiceId as passthrough and does not use it for access', () => {
		const invoice = invoiceFromRdo(rdo);
		expect(invoice.practiceId).toBe(rdo.practiceId);
		expect(canAccessBillingDashboard('PRACTICE_ADMIN')).toBe(true);
		expect(canAccessBillingDashboard('NURSE')).toBe(false);
		expect(canAccessBillingDashboard).toHaveLength(1);
	});
});
