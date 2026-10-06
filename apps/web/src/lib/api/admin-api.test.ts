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
		const fetchMock = vi.fn().mockResolvedValue(jsonResponse({users: [userRdo, providerRdo]}));
		vi.stubGlobal('fetch', fetchMock);

		const users = await adminRealAPI.listUsers();

		expect(users).toEqual([
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
		expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/admin/users', expect.any(Object));
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
	});

	it('lists audit events from Nest and unwraps AuditEventSearchResultRdo', async () => {
		localStorage.setItem('auth_token', 'demo-access-token');
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse({events: [eventRdo], hasMore: false}),
		);
		vi.stubGlobal('fetch', fetchMock);

		const events = await adminRealAPI.listAuditEvents();

		expect(events).toEqual([
			expect.objectContaining({
				id: eventId,
				action: 'auth.login.succeeded',
				resourceType: 'session',
				practiceId,
				actorUserId: userId,
			}),
		]);
		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:3001/admin/audit-events',
			expect.any(Object),
		);
		expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('practiceId');
		expectCredentialedCookieFetch(fetchMock.mock.calls[0]);
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
