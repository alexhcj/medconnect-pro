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
import {claimListQuery, invoiceListQuery} from '@/lib/billing/list-params';
import {apiFetch} from '@/lib/api/http';
import {billingMockAPI} from '@/lib/api/mocks/billing-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {nestApiBaseUrl} from '@/lib/api/nest-api';
import type {PagedResult} from '@/types/admin/admin-list';
import type {ClaimListParams, InvoiceListParams} from '@/types/billing/billing-list';
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
	listInvoices: async (params: InvoiceListParams = {page: 1}): Promise<PagedResult<Invoice>> => {
		const result = await apiFetch<InvoiceListRdo>(
			`${billingInvoicesUrl()}?${invoiceListQuery(params)}`,
		);
		return {
			items: result.invoices.map(invoiceFromRdo),
			total: result.total,
			hasMore: result.hasMore,
			nextPage: result.nextPage,
		};
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
	listClaims: async (params: ClaimListParams = {page: 1}): Promise<PagedResult<Claim>> => {
		const result = await apiFetch<ClaimListRdo>(`${billingClaimsUrl()}?${claimListQuery(params)}`);
		return {
			items: result.claims.map(claimFromRdo),
			total: result.total,
			hasMore: result.hasMore,
			nextPage: result.nextPage,
		};
	},
};

export const billingAPI = isMockMode() ? billingMockAPI : billingRealAPI;
