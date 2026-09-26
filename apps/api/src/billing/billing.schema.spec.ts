import {describe, expect, it} from 'vitest';
import {invoiceCreateSchema, paymentCreateSchema} from './billing.schema.js';

const patientId = '00000000-0000-4000-8000-0000000000aa';
const invoiceId = '00000000-0000-4000-8000-0000000000bb';

describe('billing schemas', () => {
	it('rejects card and bank account fields on invoice create', () => {
		const result = invoiceCreateSchema.safeParse({
			patientId,
			dueAt: '2026-09-15T00:00:00.000Z',
			lineItems: [{description: 'Office visit', amountCents: 15000}],
			cardNumber: '4111111111111111',
			cvv: '123',
		});
		expect(result.success).toBe(false);
	});

	it('rejects card and bank account fields on payment create', () => {
		const result = paymentCreateSchema.safeParse({
			invoiceId,
			method: 'stripe',
			cardNumber: '4111111111111111',
			cvv: '123',
			accountNumber: '000123456789',
		});
		expect(result.success).toBe(false);
	});
});
