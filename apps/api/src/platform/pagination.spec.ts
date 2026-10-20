import {describe, expect, it} from 'vitest';
import {z} from 'zod';
import {pageQueryShape, resolvePageRequest, toPageMeta} from './pagination.js';

const schema = z.object(pageQueryShape);

describe('list pagination helpers', () => {
	it('accepts omitted and empty values', () => {
		expect(schema.parse({})).toEqual({});
		expect(schema.parse({page: '', pageSize: ''})).toEqual({});
	});

	it('coerces numeric strings and rejects out-of-range values', () => {
		expect(schema.parse({page: '2', pageSize: '100'})).toEqual({page: 2, pageSize: 100});
		expect(schema.safeParse({page: '0'}).success).toBe(false);
		expect(schema.safeParse({page: '1001'}).success).toBe(false);
		expect(schema.safeParse({pageSize: '101'}).success).toBe(false);
		expect(schema.safeParse({pageSize: '0'}).success).toBe(false);
		expect(schema.safeParse({page: '1.5'}).success).toBe(false);
	});

	it('defaults to the first page of 25', () => {
		expect(resolvePageRequest({})).toEqual({page: 1, pageSize: 25});
	});

	it('reports total, hasMore and nextPage', () => {
		expect(toPageMeta(60, {page: 1, pageSize: 25})).toEqual({total: 60, hasMore: true, nextPage: 2});
		expect(toPageMeta(60, {page: 3, pageSize: 25})).toEqual({
			total: 60,
			hasMore: false,
			nextPage: undefined,
		});
		expect(toPageMeta(0, {page: 1, pageSize: 25}).hasMore).toBe(false);
	});
});
