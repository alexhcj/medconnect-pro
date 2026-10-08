export const PAYMENT_METHODS = ['stripe', 'ach'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['recorded'] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Payment {
	id: string;
	invoiceId: string;
	practiceId: string;
	amountCents: number;
	method: PaymentMethod;
	processorRef: string;
	status: PaymentStatus;
	synthetic: boolean;
}
