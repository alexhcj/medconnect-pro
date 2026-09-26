import {describe, expect, it} from 'vitest';
import {DemoPaymentGateway} from './demo-payment-gateway.js';

describe('DemoPaymentGateway', () => {
	it('records a synthetic processor reference without card data', async () => {
		const gateway = new DemoPaymentGateway();
		const result = await gateway.charge({
			invoiceId: '00000000-0000-4000-8000-0000000000aa',
			amountCents: 15000,
			method: 'stripe',
		});
		expect(result.status).toBe('recorded');
		expect(result.processorRef).toMatch(/^demo_/);
		expect(JSON.stringify(result)).not.toMatch(/cardNumber|cvv|accountNumber|PAN/i);
	});
});
