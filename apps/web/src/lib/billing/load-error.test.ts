import {describe, expect, it} from 'vitest';
import {ApiError} from '@/lib/api/http';
import {billingLoadErrorMessage} from '@/lib/billing/load-error';

describe('billingLoadErrorMessage', () => {
	it('returns the ApiError message for live and not-found failures', () => {
		expect(billingLoadErrorMessage(new ApiError('Unable to load invoices.', 502), 'Unable to load invoices.')).toBe(
			'Unable to load invoices.',
		);
		expect(billingLoadErrorMessage(new ApiError('Invoice was not found.', 404), 'Unable to load this invoice.')).toBe(
			'Invoice was not found.',
		);
	});

	it('returns the fallback for mock Error objects', () => {
		expect(billingLoadErrorMessage(new Error('Mock: Failed to load invoices'), 'Unable to load invoices.')).toBe(
			'Unable to load invoices.',
		);
	});
});
