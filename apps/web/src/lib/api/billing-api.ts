import {
	claimFromRdo,
	invoiceFromRdo,
	paymentFromRdo,
	type ClaimListRdo,
	type InvoiceListRdo,
	type InvoiceRdo,
	type PaymentCreateBody,
	type PaymentRdo,
} from '@/lib/api/billing-rdo';
import {apiFetch} from '@/lib/api/http';
import {billingMockAPI} from '@/lib/api/mocks/billing-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {nestApiBaseUrl} from '@/lib/api/nest-api';
import type {Claim} from '@/types/billing/claim';
import type {Invoice} from '@/types/billing/invoice';
import type {Payment} from '@/types/billing/payment';

function billingInvoicesUrl(path = ''): string {
	return `${nestApiBaseUrl()}/billing/invoices${path}`;
}

function billingPaymentsUrl(): string {
	return `${nestApiBaseUrl()}/billing/payments`;
}

function billingClaimsUrl(): string {
	return `${nestApiBaseUrl()}/billing/claims`;
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
	recordPayment: async (body: PaymentCreateBody): Promise<Payment> => {
		const rdo = await apiFetch<PaymentRdo>(billingPaymentsUrl(), {
			method: 'POST',
			body: JSON.stringify({invoiceId: body.invoiceId, method: body.method}),
		});
		return paymentFromRdo(rdo);
	},
	listClaims: async (): Promise<Claim[]> => {
		const result = await apiFetch<ClaimListRdo>(billingClaimsUrl());
		return result.claims.map(claimFromRdo);
	},
};

export const billingAPI = isMockMode() ? billingMockAPI : billingRealAPI;
