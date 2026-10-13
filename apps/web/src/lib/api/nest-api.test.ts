import {afterEach, describe, expect, it} from 'vitest';
import {nestApiBaseUrl} from '@/lib/api/nest-api';

describe('nestApiBaseUrl', () => {
	const previous = process.env.NEXT_PUBLIC_API_BASE_URL;

	afterEach(() => {
		if (previous === undefined) {
			delete process.env.NEXT_PUBLIC_API_BASE_URL;
		} else {
			process.env.NEXT_PUBLIC_API_BASE_URL = previous;
		}
	});

	it('defaults to the local API origin', () => {
		delete process.env.NEXT_PUBLIC_API_BASE_URL;
		expect(nestApiBaseUrl()).toBe('http://localhost:3001');
	});

	it('keeps a same-origin proxy path', () => {
		process.env.NEXT_PUBLIC_API_BASE_URL = '/mcp-api/';
		expect(nestApiBaseUrl()).toBe('/mcp-api');
	});
});