import type {ClaimProcessor, ClaimStatus} from '@/types/billing/claim';
import type {InvoiceStatus} from '@/types/billing/invoice';
import type {PaymentMethod} from '@/types/billing/payment';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
	stripe: 'Stripe (demo)',
	ach: 'ACH (demo)',
};

export function formatInvoiceAmount(amountCents: number, currency = 'USD'): string {
	return new Intl.NumberFormat('en-US', {style: 'currency', currency}).format(amountCents / 100);
}

export function formatInvoiceDate(iso: string): string {
	return new Date(iso).toLocaleDateString();
}

export function invoiceStatusLabel(status: InvoiceStatus): string {
	if (status === 'issued') {
		return 'Issued';
	}
	if (status === 'paid') {
		return 'Paid';
	}
	return 'Overdue';
}

export function claimStatusLabel(status: ClaimStatus): string {
	return status === 'not_submitted' ? 'Not submitted' : status;
}

export function claimProcessorLabel(processor: ClaimProcessor): string {
	return processor === 'edi837' ? 'EDI 837 (labeled)' : processor;
}
