import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {billingAPI} from '@/lib/api/billing-api';
import type {PaymentCreateBody} from '@/lib/api/billing-rdo';

export const billingInvoicesQueryKey = ['billing', 'invoices'] as const;

export function invoiceQueryKey(invoiceId: string) {
	return ['billing', 'invoice', invoiceId] as const;
}

export function useInvoices(enabled = true) {
	return useQuery({
		queryKey: billingInvoicesQueryKey,
		queryFn: () => billingAPI.listInvoices(),
		enabled,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
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

export function useRecordPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (body: PaymentCreateBody) => billingAPI.recordPayment(body),
		onSuccess: (_payment, body) => {
			void queryClient.invalidateQueries({queryKey: billingInvoicesQueryKey});
			void queryClient.invalidateQueries({queryKey: invoiceQueryKey(body.invoiceId)});
		},
	});
}
