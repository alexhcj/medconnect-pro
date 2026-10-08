import {describe, expect, it} from 'vitest';
import {
	claimProcessorLabel,
	claimStatusLabel,
	formatInvoiceAmount,
	formatInvoiceDate,
	invoiceStatusLabel,
} from '@/lib/billing/format';

describe('invoice format helpers', () => {
	it('formats amounts as USD currency', () => {
		expect(formatInvoiceAmount(15000)).toBe('$150.00');
		expect(formatInvoiceAmount(8000, 'USD')).toBe('$80.00');
	});

	it('labels invoice statuses', () => {
		expect(invoiceStatusLabel('issued')).toBe('Issued');
		expect(invoiceStatusLabel('paid')).toBe('Paid');
		expect(invoiceStatusLabel('overdue')).toBe('Overdue');
	});

	it('labels claim envelope status and processor', () => {
		expect(claimStatusLabel('not_submitted')).toBe('Not submitted');
		expect(claimProcessorLabel('edi837')).toBe('EDI 837 (labeled)');
	});

	it('formats an ISO date with the locale date string', () => {
		expect(formatInvoiceDate('2026-09-15T00:00:00.000Z')).toBe(
			new Date('2026-09-15T00:00:00.000Z').toLocaleDateString(),
		);
	});
});
