import {afterEach, describe, expect, it, vi} from 'vitest';
import {adminRealAPI} from '@/lib/api/admin-api';
import type {AuditEventRdo, PracticeUserRdo} from '@/lib/api/admin-rdo';

const userId = '11111111-1111-4111-8111-111111111111';
const practiceId = '22222222-2222-4222-8222-222222222222';
const eventId = '33333333-3333-4333-8333-333333333333';

const userRdo: PracticeUserRdo = {
	id: userId,
	email: 'practice.admin@example.test',
	role: 'PRACTICE_ADMIN',
	practiceId,
	synthetic: true,
};

const providerRdo: PracticeUserRdo = {
	id: '44444444-4444-4444-8444-444444444444',
	email: 'jordan.ellis@synthetic.example',
	role: 'PROVIDER',
	practiceId,
	synthetic: true,
};

const eventRdo: AuditEventRdo = {
	id: eventId,
	practiceId,
	actorUserId: userId,
	action: 'auth.login.succeeded',
	resourceType: 'session',
	resourceId: '55555555-5555-4555-8555-555555555555',
	correlationId: '66666666-6666-4666-8666-666666666666',
	createdAt: '2026-09-27T14:00:00.000Z',
};

function jsonResponse(body: unknown, status = 200) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	};
}

function expectCredentialedCookieFetch(call: unknown[] | undefined) {
	const init = call?.[1] as RequestInit | undefined;
	expect(init?.credentials).toBe('include');
	expect(new Headers(init?.headers).get('Authorization')).toBeNull();
}

describe('adminRealAPI', () => {
	afterEach(() => {
		localStorage.removeItem('auth_token');
		vi.unstubAllGlobals();
	});

	it('lists practice users from Nest and unwraps PracticeUserListRdo', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({users: [userRdo, providerRdo], total: 2, hasMore: false}));
		vi.stubGlobal('fetch', fetchMock);

		const result = await adminRealAPI.listUsers();

		expect(result.total).toBe(2);
		expect(result.hasMore).toBe(false);
		expect(result.items).toEqual([
			expect.objectContaining({
				id: userId,
				email: 'practice.admin@example.test',
				role: 'PRACTICE_ADMIN',
				practiceId,
				synthetic: true,
			}),
			expect.objectContaining({
				email: 'jordan.ellis@synthetic.example',
				role: 'PROVIDER',
				synthetic: true,
			}),
		]);
		expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/admin/users?page=1&pageSize=25', expect.any(Object));
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
	});

	it('lists audit events from Nest and unwraps AuditEventSearchResultRdo', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse({events: [eventRdo], total: 1, hasMore: false}),
		);
		vi.stubGlobal('fetch', fetchMock);

		const result = await adminRealAPI.listAuditEvents();

		expect(result.total).toBe(1);
		expect(result.items).toEqual([
			expect.objectContaining({
				id: eventId,
				action: 'auth.login.succeeded',
				resourceType: 'session',
				practiceId,
				actorUserId: userId,
			}),
		]);
		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:3001/admin/audit-events?page=1&pageSize=25',
			expect.any(Object),
		);
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
	});

	it('lists security events from Nest and unwraps AuditEventSearchResultRdo', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse({events: [eventRdo], total: 1, hasMore: false}),
		);
		vi.stubGlobal('fetch', fetchMock);

		const result = await adminRealAPI.listSecurityEvents();

		expect(result.total).toBe(1);
		expect(result.items).toEqual([
			expect.objectContaining({
				id: eventId,
				action: 'auth.login.succeeded',
				resourceType: 'session',
				practiceId,
				actorUserId: userId,
			}),
		]);
		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:3001/admin/security-events?page=1&pageSize=25',
			expect.any(Object),
		);
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
	});

	it('sends page, filters and UTC day bounds for audit events without a tenant id', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse({events: [], total: 0, hasMore: false}),
		);
		vi.stubGlobal('fetch', fetchMock);

		await adminRealAPI.listAuditEvents({
			page: 3,
			action: 'role_changed',
			resourceType: 'user',
			from: '2026-10-01',
			to: '2026-10-05',
		});

		const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
		expect(url.pathname).toBe('/admin/audit-events');
		expect(url.searchParams.get('page')).toBe('3');
		expect(url.searchParams.get('pageSize')).toBe('25');
		expect(url.searchParams.get('action')).toBe('role_changed');
		expect(url.searchParams.get('resourceType')).toBe('user');
		expect(url.searchParams.get('from')).toBe('2026-10-01T00:00:00.000Z');
		expect(url.searchParams.get('to')).toBe('2026-10-05T23:59:59.999Z');
		expect(url.search).not.toMatch(/practice|tenant/i);
	});

	it('sends search and role filters for users', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse({users: [], total: 0, hasMore: false}),
		);
		vi.stubGlobal('fetch', fetchMock);

		await adminRealAPI.listUsers({page: 2, q: 'nurse', role: 'NURSE'});

		const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
		expect(url.searchParams.get('page')).toBe('2');
		expect(url.searchParams.get('q')).toBe('nurse');
		expect(url.searchParams.get('role')).toBe('NURSE');
	});

	it('maps a 403 security-events envelope onto ApiError', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(
				{
					error: {
						code: 'FORBIDDEN',
						message: 'You do not have permission to perform this action',
					},
					correlationId: '66666666-6666-4666-8666-666666666666',
				},
				403,
			),
		);
		vi.stubGlobal('fetch', fetchMock);

		await expect(adminRealAPI.listSecurityEvents()).rejects.toMatchObject({
			status: 403,
			code: 'FORBIDDEN',
			message: 'You do not have permission to perform this action',
		});
	});

	it('PATCHes a membership role without a client practiceId', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const updated: PracticeUserRdo = {...providerRdo, role: 'NURSE'};
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse(updated));
		vi.stubGlobal('fetch', fetchMock);

		const user = await adminRealAPI.assignRole(providerRdo.id, 'NURSE');

		expect(user).toEqual(
			expect.objectContaining({
				id: providerRdo.id,
				email: 'jordan.ellis@synthetic.example',
				role: 'NURSE',
				practiceId,
				synthetic: true,
			}),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:3001/admin/users/${providerRdo.id}/roles`,
			expect.objectContaining({
				method: 'PATCH',
				body: JSON.stringify({role: 'NURSE'}),
			}),
		);
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
		expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body))).toEqual({
			role: 'NURSE',
		});
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
	});

	it('maps a 403 forbidden grant onto ApiError', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(
				{
					error: {
						code: 'FORBIDDEN',
						message: 'You do not have permission to perform this action',
					},
					correlationId: '66666666-6666-4666-8666-666666666666',
				},
				403,
			),
		);
		vi.stubGlobal('fetch', fetchMock);

		await expect(adminRealAPI.assignRole(providerRdo.id, 'SUPER_ADMIN')).rejects.toMatchObject({
			status: 403,
			code: 'FORBIDDEN',
			message: 'You do not have permission to perform this action',
		});
	});

	it('maps a 400 validation envelope onto ApiError', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse(
				{
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Request validation failed',
						details: [{path: 'role', message: 'Invalid option'}],
					},
				},
				400,
			),
		);
		vi.stubGlobal('fetch', fetchMock);

		await expect(adminRealAPI.assignRole(providerRdo.id, 'NURSE')).rejects.toMatchObject({
			status: 400,
			code: 'VALIDATION_ERROR',
			message: 'Request validation failed',
		});
	});
});
