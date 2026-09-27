import {afterEach, describe, expect, it, vi} from 'vitest';
import {adminRealAPI} from '@/lib/api/admin-api';
import {ApiError} from '@/lib/api/http';

describe('adminRealAPI', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('rejects live user list without calling Nest or Next audit routes', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await expect(adminRealAPI.listUsers()).rejects.toMatchObject({status: 404});
		await expect(adminRealAPI.listUsers()).rejects.toBeInstanceOf(ApiError);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('rejects live audit list without calling Nest or Next audit routes', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await expect(adminRealAPI.listAuditEvents()).rejects.toMatchObject({status: 404});
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
