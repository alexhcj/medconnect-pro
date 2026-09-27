import {afterEach, describe, expect, it, vi} from 'vitest';
import {billingRealAPI} from '@/lib/api/billing-api';
import type {InvoiceRdo} from '@/lib/api/billing-rdo';

const invoiceId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const rdo: InvoiceRdo = {
	id: invoiceId,
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

function jsonResponse(body: unknown, status = 200) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	};
}

function authorizationFromCall(call: unknown[] | undefined) {
	const init = call?.[1] as RequestInit | undefined;
	return new Headers(init?.headers).get('Authorization');
}

describe('billingRealAPI', () => {
	afterEach(() => {
		localStorage.removeItem('auth_token');
		vi.unstubAllGlobals();
	});

	it('lists invoices from Nest and unwraps InvoiceListRdo', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({invoices: [rdo]}));
		vi.stubGlobal('fetch', fetchMock);

		const invoices = await billingRealAPI.listInvoices();

		expect(invoices).toEqual([
			expect.objectContaining({
				id: invoiceId,
				patientName: 'Avery Quinn',
				status: 'overdue',
				amountCents: 15000,
				synthetic: true,
			}),
		]);
		expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/billing/invoices', expect.any(Object));
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
		expect(authorizationFromCall(fetchMock.mock.calls[0])).toBe('Bearer demo-access-token');
	});

	it('gets an invoice from Nest by server UUID', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(rdo));
		vi.stubGlobal('fetch', fetchMock);

		await expect(billingRealAPI.getInvoice(invoiceId)).resolves.toMatchObject({
			id: invoiceId,
			patientName: 'Avery Quinn',
			lineItems: [{description: 'Office visit', amountCents: 15000}],
		});
		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:3001/billing/invoices/${invoiceId}`,
			expect.any(Object),
		);
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('demo-invoice');
		expect(authorizationFromCall(fetchMock.mock.calls[0])).toBe('Bearer demo-access-token');
	});
});
