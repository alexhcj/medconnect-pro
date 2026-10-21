import {keepPreviousData, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {billingAPI} from '@/lib/api/billing-api';
import type {PaymentCreateBody} from '@/lib/api/billing-rdo';
import type {ClaimListParams, InvoiceListParams} from '@/types/billing/billing-list';

export const billingInvoicesQueryKey = ['billing', 'invoices'] as const;
export const billingClaimsQueryKey = ['billing', 'claims'] as const;

export function invoiceQueryKey(invoiceId: string) {
	return ['billing', 'invoice', invoiceId] as const;
}

/** Keeps the previous page on screen while the next one loads, so paging does not flash a skeleton. */
const listQueryOptions = {
	staleTime: 5 * 60 * 1000,
	gcTime: 10 * 60 * 1000,
	placeholderData: keepPreviousData,
};

export function useInvoices(params: InvoiceListParams = {page: 1}, enabled = true) {
	return useQuery({
		queryKey: [...billingInvoicesQueryKey, params],
		queryFn: () => billingAPI.listInvoices(params),
		enabled,
		...listQueryOptions,
	});
}

export function useInvoice(invoiceId: string, enabled = true) {
	return useQuery({
		queryKey: invoiceQueryKey(invoiceId),
		queryFn: () => billingAPI.getInvoice(invoiceId),
		enabled: enabled && !!invoiceId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useClaims(params: ClaimListParams = {page: 1}, enabled = true) {
	return useQuery({
		queryKey: [...billingClaimsQueryKey, params],
		queryFn: () => billingAPI.listClaims(params),
		enabled,
		...listQueryOptions,
	});
}

export function useRecordPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (body: PaymentCreateBody) => billingAPI.recordPayment(body),
		onSuccess: (_payment, body) => {
			void queryClient.invalidateQueries({queryKey: billingInvoicesQueryKey});
			void queryClient.invalidateQueries({queryKey: invoiceQueryKey(body.invoiceId)});
			void queryClient.invalidateQueries({queryKey: billingClaimsQueryKey});
		},
	});
}
