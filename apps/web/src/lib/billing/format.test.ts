import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
	claimProcessorLabel,
	claimStatusLabel,
	formatInvoiceAmount,
	formatInvoiceDate,
	INVOICE_STATUS_TEXT_CLASS,
	invoiceStatusLabel,
	invoiceStatusTextClass,
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

	it('maps every invoice status to a text colour class', () => {
		expect(invoiceStatusTextClass('paid')).toBe('text-success-strong');
		expect(invoiceStatusTextClass('overdue')).toBe('text-danger');
		expect(invoiceStatusTextClass('issued')).toBe('text-foreground-secondary');
		expect(Object.keys(INVOICE_STATUS_TEXT_CLASS).sort()).toEqual(['issued', 'overdue', 'paid']);
	});

	it('keeps status text at 4.5:1 on the surface and canvas tokens', () => {
		const css = readFileSync(resolve(__dirname, '../../styles/tokens.css'), 'utf8');
		const token = (name: string) => {
			const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
			expect(match, `--${name} is defined`).not.toBeNull();
			return match![1];
		};
		const luminance = (hex: string) => {
			const [r, g, b] = [1, 3, 5]
				.map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
				.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		};
		const contrast = (a: string, b: string) => {
			const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
			return (hi + 0.05) / (lo + 0.05);
		};
		const backgrounds = [token('color-bg-surface'), token('color-bg-canvas')];
		const statusText = [
			token('color-text-success-strong'),
			token('color-text-danger'),
			token('color-text-secondary'),
		];

		for (const text of statusText) {
			for (const background of backgrounds) {
				expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
			}
		}
		// The original success token stays for non-text use because it fails text contrast.
		expect(contrast(token('color-text-success'), backgrounds[0])).toBeLessThan(4.5);
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
