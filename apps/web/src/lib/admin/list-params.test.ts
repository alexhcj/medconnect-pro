import {describe, expect, it} from 'vitest';
import {
	dateRangeError,
	eventListQuery,
	pageCount,
	pageRange,
	parseDay,
	parsePage,
	userListQuery,
} from '@/lib/admin/list-params';

describe('list params', () => {
	it('always sends page and an explicit pageSize of 25', () => {
		expect(eventListQuery({page: 1})).toBe('page=1&pageSize=25');
		expect(userListQuery({page: 3})).toBe('page=3&pageSize=25');
	});

	it('maps UTC days to ISO instants and drops blank filters', () => {
		const query = new URLSearchParams(
			eventListQuery({
				page: 2,
				action: ' role_changed ',
				resourceType: '  ',
				from: '2026-10-01',
				to: '2026-10-05',
			}),
		);
		expect(query.get('action')).toBe('role_changed');
		expect(query.has('resourceType')).toBe(false);
		expect(query.get('from')).toBe('2026-10-01T00:00:00.000Z');
		expect(query.get('to')).toBe('2026-10-05T23:59:59.999Z');
	});

	it('never carries tenant scope', () => {
		expect(eventListQuery({page: 1, action: 'x'})).not.toMatch(/practice|tenant/i);
		expect(userListQuery({page: 1, q: 'a', role: 'NURSE'})).not.toMatch(/practice|tenant/i);
	});

	it('accepts a same-day range and rejects a reversed one', () => {
		expect(dateRangeError('2026-10-05', '2026-10-05')).toBeNull();
		expect(dateRangeError('2026-10-05', '2026-10-01')).not.toBeNull();
		expect(dateRangeError(undefined, '2026-10-01')).toBeNull();
	});

	it('falls back to page 1 or no day for invalid URL values', () => {
		expect(parsePage('0')).toBe(1);
		expect(parsePage('abc')).toBe(1);
		expect(parsePage('1001')).toBe(1);
		expect(parsePage('7')).toBe(7);
		expect(parsePage(null)).toBe(1);
		expect(parseDay('2026-13-40')).toBeUndefined();
		expect(parseDay('10/01/2026')).toBeUndefined();
		expect(parseDay('2026-10-01')).toBe('2026-10-01');
	});

	it('computes ranges and page counts', () => {
		expect(pageRange(2, 25)).toEqual({first: 26, last: 50});
		expect(pageRange(13, 12)).toEqual({first: 301, last: 312});
		expect(pageRange(1, 0)).toEqual({first: 0, last: 0});
		expect(pageCount(312)).toBe(13);
		expect(pageCount(0)).toBe(1);
	});
});
