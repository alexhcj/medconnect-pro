import type {Invoice, InvoiceStatus} from '@/types/billing/invoice';
import type {Payment, PaymentMethod, PaymentStatus} from '@/types/billing/payment';

/** Line item returned by Nest `InvoiceLineItemRdo`. */
export interface InvoiceLineItemRdo {
	description: string;
	amountCents: number;
}

/** Invoice returned by Nest `InvoiceRdo`. `practiceId` is informational only. */
export interface InvoiceRdo {
	id: string;
	practiceId: string;
	patientId: string;
	patientName: string;
	status: InvoiceStatus;
	amountCents: number;
	currency: string;
	issuedAt: string;
	dueAt: string;
	lineItems: InvoiceLineItemRdo[];
	synthetic: boolean;
}

export interface InvoiceListRdo {
	invoices: InvoiceRdo[];
}

export function invoiceFromRdo(rdo: InvoiceRdo): Invoice {
	return {
		id: rdo.id,
		practiceId: rdo.practiceId,
		patientId: rdo.patientId,
		patientName: rdo.patientName,
		status: rdo.status,
		amountCents: rdo.amountCents,
		currency: rdo.currency,
		issuedAt: rdo.issuedAt,
		dueAt: rdo.dueAt,
		lineItems: rdo.lineItems.map((item) => ({
			description: item.description,
			amountCents: item.amountCents,
		})),
		synthetic: rdo.synthetic,
	};
}

/** Payment returned by Nest `PaymentRdo`. `practiceId` is informational only. */
export interface PaymentRdo {
	id: string;
	invoiceId: string;
	practiceId: string;
	amountCents: number;
	method: PaymentMethod;
	processorRef: string;
	status: PaymentStatus;
	synthetic: boolean;
}

export interface PaymentCreateBody {
	invoiceId: string;
	method: PaymentMethod;
}

export function paymentFromRdo(rdo: PaymentRdo): Payment {
	return {
		id: rdo.id,
		invoiceId: rdo.invoiceId,
		practiceId: rdo.practiceId,
		amountCents: rdo.amountCents,
		method: rdo.method,
		processorRef: rdo.processorRef,
		status: rdo.status,
		synthetic: rdo.synthetic,
	};
}
