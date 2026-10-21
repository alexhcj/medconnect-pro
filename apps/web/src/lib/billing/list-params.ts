import {
	BILLING_PAGE_SIZE,
	INVOICE_SORTS,
	type ClaimListParams,
	type InvoiceListParams,
	type InvoiceSort,
} from '@/types/billing/billing-list';
import {INVOICE_STATUSES, type InvoiceStatus} from '@/types/billing/invoice';

export function parseInvoiceStatus(value: string | null | undefined): InvoiceStatus | undefined {
	return INVOICE_STATUSES.find((status) => status === value);
}

export function parseInvoiceSort(value: string | null | undefined): InvoiceSort | undefined {
	return INVOICE_SORTS.find((sort) => sort === value);
}

export function invoiceListQuery(params: InvoiceListParams): string {
	const query = new URLSearchParams({page: String(params.page), pageSize: String(BILLING_PAGE_SIZE)});
	if (params.status) {
		query.set('status', params.status);
	}
	if (params.sort) {
		query.set('sort', params.sort);
	}
	return query.toString();
}

export function claimListQuery(params: ClaimListParams): string {
	return new URLSearchParams({page: String(params.page), pageSize: String(BILLING_PAGE_SIZE)}).toString();
}
