import {describe, expect, it} from 'vitest';
import {
	claimListQuery,
	invoiceListQuery,
	parseInvoiceSort,
	parseInvoiceStatus,
} from '@/lib/billing/list-params';

describe('billing list params', () => {
	it('builds the invoice query with page size and only set filters', () => {
		expect(invoiceListQuery({page: 1})).toBe('page=1&pageSize=10');
		expect(invoiceListQuery({page: 3, status: 'paid', sort: 'issued-asc'})).toBe(
			'page=3&pageSize=10&status=paid&sort=issued-asc',
		);
	});

	it('builds the claims query with paging only', () => {
		expect(claimListQuery({page: 2})).toBe('page=2&pageSize=10');
	});

	it('accepts only known status and sort values from the URL', () => {
		expect(parseInvoiceStatus('overdue')).toBe('overdue');
		expect(parseInvoiceStatus('void')).toBeUndefined();
		expect(parseInvoiceStatus(null)).toBeUndefined();
		expect(parseInvoiceSort('issued-asc')).toBe('issued-asc');
		expect(parseInvoiceSort('amount-desc')).toBeUndefined();
	});
});
