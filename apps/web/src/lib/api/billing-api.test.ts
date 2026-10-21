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

function expectCredentialedCookieFetch(call: unknown[] | undefined) {
	const init = call?.[1] as RequestInit | undefined;
	expect(init?.credentials).toBe('include');
	expect(new Headers(init?.headers).get('Authorization')).toBeNull();
}

describe('billingRealAPI', () => {
	afterEach(() => {
		localStorage.removeItem('auth_token');
		vi.unstubAllGlobals();
	});

	it('lists invoices from Nest and unwraps InvoiceListRdo', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({invoices: [rdo], total: 1, hasMore: false}));
		vi.stubGlobal('fetch', fetchMock);

		const page = await billingRealAPI.listInvoices();

		expect(page.items).toEqual([
			expect.objectContaining({
				id: invoiceId,
				patientName: 'Avery Quinn',
				status: 'overdue',
				amountCents: 15000,
				synthetic: true,
			}),
		]);
		expect(page).toMatchObject({total: 1, hasMore: false, nextPage: undefined});
		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:3001/billing/invoices?page=1&pageSize=10',
			expect.any(Object),
		);
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
	});

	it('sends page, status and sort to the invoice list and maps the paging fields', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(jsonResponse({invoices: [rdo], total: 60, hasMore: true, nextPage: 3}));
		vi.stubGlobal('fetch', fetchMock);

		const page = await billingRealAPI.listInvoices({page: 2, status: 'overdue', sort: 'issued-asc'});

		expect(page).toMatchObject({total: 60, hasMore: true, nextPage: 3});
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			'http://localhost:3001/billing/invoices?page=2&pageSize=10&status=overdue&sort=issued-asc',
		);
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
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
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
	});

	it('records a payment with invoiceId and method only', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const payment = {
			id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
			invoiceId,
			practiceId: rdo.practiceId,
			amountCents: 15000,
			method: 'ach',
			processorRef: 'demo_00000000-0000-4000-8000-000000000001',
			status: 'recorded',
			synthetic: true,
		};
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(payment, 201));
		vi.stubGlobal('fetch', fetchMock);

		await expect(billingRealAPI.recordPayment({invoiceId, method: 'ach'})).resolves.toMatchObject({
			invoiceId,
			method: 'ach',
			processorRef: 'demo_00000000-0000-4000-8000-000000000001',
			synthetic: true,
		});
		expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/billing/payments', expect.any(Object));
		const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
		expect(init.method).toBe('POST');
		expect(JSON.parse(String(init.body))).toEqual({invoiceId, method: 'ach'});
		expect(String(init.body)).not.toMatch(/card|pan|accountNumber/i);
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
	});

	it('lists claims envelopes from Nest and unwraps ClaimListRdo', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const claim = {
			id: invoiceId,
			invoiceId,
			status: 'not_submitted',
			processor: 'edi837',
			synthetic: true,
		};
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({claims: [claim], total: 40, hasMore: true, nextPage: 2}));
		vi.stubGlobal('fetch', fetchMock);

		const page = await billingRealAPI.listClaims({page: 1});
		expect(page.items).toEqual([
			expect.objectContaining({
				id: invoiceId,
				invoiceId,
				status: 'not_submitted',
				processor: 'edi837',
				synthetic: true,
			}),
		]);
		expect(page).toMatchObject({total: 40, hasMore: true, nextPage: 2});
		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:3001/billing/claims?page=1&pageSize=10',
			expect.any(Object),
		);
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
	});
});
