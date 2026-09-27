import {invoiceFromRdo, type InvoiceListRdo, type InvoiceRdo} from '@/lib/api/billing-rdo';
import {apiFetch} from '@/lib/api/http';
import {billingMockAPI} from '@/lib/api/mocks/billing-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {nestApiBaseUrl} from '@/lib/api/nest-api';
import type {Invoice} from '@/types/billing/invoice';

function billingInvoicesUrl(path = ''): string {
	return `${nestApiBaseUrl()}/billing/invoices${path}`;
}

export const billingRealAPI = {
	listInvoices: async (): Promise<Invoice[]> => {
		const result = await apiFetch<InvoiceListRdo>(billingInvoicesUrl());
		return result.invoices.map(invoiceFromRdo);
	},
	getInvoice: async (invoiceId: string): Promise<Invoice> => {
		const rdo = await apiFetch<InvoiceRdo>(billingInvoicesUrl(`/${invoiceId}`));
		return invoiceFromRdo(rdo);
	},
};

export const billingAPI = isMockMode() ? billingMockAPI : billingRealAPI;
