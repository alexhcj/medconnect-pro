import {useQuery} from '@tanstack/react-query';
import {billingAPI} from '@/lib/api/billing-api';

export function useInvoices(enabled = true) {
	return useQuery({
		queryKey: ['billing', 'invoices'],
		queryFn: () => billingAPI.listInvoices(),
		enabled,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useInvoice(invoiceId: string, enabled = true) {
	return useQuery({
		queryKey: ['billing', 'invoice', invoiceId],
		queryFn: () => billingAPI.getInvoice(invoiceId),
		enabled: enabled && !!invoiceId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}
