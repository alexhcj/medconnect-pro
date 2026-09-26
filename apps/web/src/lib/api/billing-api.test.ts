import {afterEach, describe, expect, it, vi} from 'vitest';
import {BILLING_API_UNAVAILABLE, billingRealAPI} from '@/lib/api/billing-api';

describe('billingRealAPI', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('does not call Nest and labels billing as unavailable until BE-007', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await expect(billingRealAPI.listInvoices()).rejects.toMatchObject({
			status: 404,
			message: BILLING_API_UNAVAILABLE,
		});
		await expect(billingRealAPI.getInvoice('demo-invoice-001')).rejects.toMatchObject({
			status: 404,
			message: BILLING_API_UNAVAILABLE,
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
