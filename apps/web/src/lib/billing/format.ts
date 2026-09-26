import type {InvoiceStatus} from '@/types/billing/invoice';

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
