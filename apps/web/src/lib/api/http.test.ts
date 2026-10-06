import {afterEach, describe, expect, it, vi} from 'vitest';
import {apiErrorFromBody, apiFetch, ApiError, CSRF_HEADER_NAME} from '@/lib/api/http';

describe('apiErrorFromBody', () => {
	it('reads the documented error envelope', () => {
		const error = apiErrorFromBody(
			{
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [{path: 'email', message: 'Taken'}],
				},
				correlationId: 'abc',
			},
			400,
		);

		expect(error).toBeInstanceOf(ApiError);
		expect(error.message).toBe('Request validation failed');
		expect(error.status).toBe(400);
		expect(error.code).toBe('VALIDATION_ERROR');
		expect(error.details).toEqual([{path: 'email', message: 'Taken'}]);
	});

	it('keeps a string error body as the message', () => {
		const error = apiErrorFromBody({error: 'nope'}, 500);
		expect(error.message).toBe('nope');
		expect(error.details).toBeUndefined();
	});

	it('falls back when the body has no message', () => {
		expect(apiErrorFromBody({}, 502).message).toBe('Request failed');
	});
});

describe('apiFetch', () => {
	afterEach(() => {
		localStorage.removeItem('auth_token');
		document.cookie = 'mcp_csrf=; max-age=0; path=/';
		vi.unstubAllGlobals();
	});

	it('sends credentialed cookies and does not attach a stored bearer', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ok: true}),
		});
		vi.stubGlobal('fetch', fetchMock);

		await apiFetch('http://localhost:3001/dashboard/overview');

		const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
		expect(init.credentials).toBe('include');
		const headers = new Headers(init.headers);
		expect(headers.get('Authorization')).toBeNull();
		expect(headers.get(CSRF_HEADER_NAME)).toBeNull();
	});

	it('sends X-CSRF-Token on mutations when mcp_csrf is present', async () => {
		document.cookie = 'mcp_csrf=hosted-csrf';
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 204,
		});
		vi.stubGlobal('fetch', fetchMock);

		await apiFetch('http://localhost:3001/auth/logout', {method: 'POST'});

		const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
		expect(init.credentials).toBe('include');
		const headers = new Headers(init.headers);
		expect(headers.get(CSRF_HEADER_NAME)).toBe('hosted-csrf');
		expect(headers.get('Content-Type')).toBe('application/json');
		expect(headers.get('Authorization')).toBeNull();
	});

	it('throws the parsed envelope from a failed response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 400,
				json: async () => ({
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Request validation failed',
						details: [{path: 'phone', message: 'Phone is required'}],
					},
				}),
			}),
		);

		await expect(apiFetch('/api/patients')).rejects.toMatchObject({
			message: 'Request validation failed',
			status: 400,
			code: 'VALIDATION_ERROR',
			details: [{path: 'phone', message: 'Phone is required'}],
		});
	});

	it('does not send the browser to login for a Next route 401', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 401,
				json: async () => ({error: 'Unauthorized'}),
			}),
		);

		await expect(apiFetch('/api/local-route')).rejects.toMatchObject({status: 401});
		expect(window.location.pathname).not.toContain('login');
	});
});