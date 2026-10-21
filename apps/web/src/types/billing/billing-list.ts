import type {InvoiceStatus} from '@/types/billing/invoice';

export const INVOICE_SORTS = ['issued-desc', 'issued-asc'] as const;

export type InvoiceSort = (typeof INVOICE_SORTS)[number];

/** Rows per page for the invoice and claims lists (the API default is 25). */
export const BILLING_PAGE_SIZE = 10;

export const DEFAULT_INVOICE_SORT: InvoiceSort = 'issued-desc';

/** Filters for the invoice list. Tenant and own-patient scope always come from the session, never from here. */
export interface InvoiceListParams {
	page: number;
	status?: InvoiceStatus;
	sort?: InvoiceSort;
}

export interface ClaimListParams {
	page: number;
}
