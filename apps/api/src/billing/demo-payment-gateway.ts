import {randomUUID} from 'node:crypto';
import {Injectable} from '@nestjs/common';
import type {PaymentChargeInput, PaymentChargeResult, PaymentGateway} from './payment-gateway.js';

/**
 * In-process Stripe/ACH stand-in. Does not call a processor, accept PAN, or persist card data.
 */
@Injectable()
export class DemoPaymentGateway implements PaymentGateway {
	async charge(input: PaymentChargeInput): Promise<PaymentChargeResult> {
		void input.invoiceId;
		void input.amountCents;
		void input.method;
		return {
			processorRef: `demo_${randomUUID()}`,
			status: 'recorded',
		};
	}
}
