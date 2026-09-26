import type {PaymentMethod} from '../persistence/entities/payment.entity.js';

export type PaymentChargeInput = {
	invoiceId: string;
	amountCents: number;
	method: PaymentMethod;
};

export type PaymentChargeResult = {
	processorRef: string;
	status: 'recorded';
};

export interface PaymentGateway {
	charge(input: PaymentChargeInput): Promise<PaymentChargeResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
