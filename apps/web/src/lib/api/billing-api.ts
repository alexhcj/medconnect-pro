import {ApiError} from '@/lib/api/http';
import {billingMockAPI} from '@/lib/api/mocks/billing-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';
import type {Invoice} from '@/types/billing/invoice';

export const BILLING_API_UNAVAILABLE = 'Billing API is not available until BE-007';

function billingUnavailable(): Promise<never> {
	return Promise.reject(new ApiError(BILLING_API_UNAVAILABLE, 404));
}

export const billingRealAPI = {
	listInvoices: async (): Promise<Invoice[]> => billingUnavailable(),
	getInvoice: async (_invoiceId: string): Promise<Invoice> => billingUnavailable(),
};

export const billingAPI = isMockMode() ? billingMockAPI : billingRealAPI;
