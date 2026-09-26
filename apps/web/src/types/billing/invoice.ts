export const INVOICE_STATUSES = ['issued', 'paid', 'overdue'] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceLineItem {
	description: string;
	amountCents: number;
}

export interface Invoice {
	id: string;
	practiceId: string;
	patientId: string;
	patientName: string;
	status: InvoiceStatus;
	amountCents: number;
	currency: string;
	issuedAt: string;
	dueAt: string;
	lineItems: InvoiceLineItem[];
	synthetic: boolean;
}
