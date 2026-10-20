import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {ApiError} from '@/lib/api/http';
import {adminMockAPI, resetAdminMock} from '@/lib/api/mocks/admin-mock';
import {clearMockSession, writeMockSession} from '@/lib/api/mocks/mock-session-store';
import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';
import type {SessionInfo} from '@/types/auth/session';

function sessionFor(userId: string, role: SessionInfo['userRole']): SessionInfo {
	const now = Date.now();
	return {
		sessionId: `session-${userId}`,
		userId,
		userRole: role,
		expiresAt: now + 60 * 60 * 1000,
		lastActivity: now,
		isActive: true,
		permissions: [...DEFAULT_ROLE_PERMISSIONS[role]],
		currentContext: 'dashboard',
	};
}

describe('adminMockAPI', () => {
	beforeEach(() => {
		resetAdminMock();
		clearMockSession();
	});

	afterEach(() => {
		resetAdminMock();
		clearMockSession();
	});

	it('lists synthetic practice users with catalog roles and no passwords', async () => {
		const {items: users} = await adminMockAPI.listUsers();

		expect(users.length).toBeGreaterThan(0);
		expect(users.slice(0, 6).map((user) => user.role)).toEqual([
			'SUPER_ADMIN',
			'PRACTICE_ADMIN',
			'PROVIDER',
			'NURSE',
			'RECEPTIONIST',
			'PATIENT',
		]);
		expect(users[1]).toEqual(
			expect.objectContaining({
				id: 'user_mock_practice_admin',
				email: 'practice.admin@example.test',
				role: 'PRACTICE_ADMIN',
				practiceId: 'demo-practice-001',
				synthetic: true,
			}),
		);
		expect(users.every((user) => !('password' in user))).toBe(true);
	});

	it('lists synthetic audit events with metadata only', async () => {
		const {items: events} = await adminMockAPI.listAuditEvents();

		expect(events.length).toBeGreaterThan(0);
		expect(events[0]).toEqual(
			expect.objectContaining({
				id: 'demo-audit-001',
				practiceId: 'demo-practice-001',
				actorUserId: 'user_mock_practice_admin',
				action: 'auth.login.succeeded',
				resourceType: 'session',
				resourceId: null,
				correlationId: 'demo-correlation-001',
				createdAt: '2026-09-26T14:00:00.000Z',
			}),
		);
		expect(events.some((event) => event.action === 'patient.accessed')).toBe(true);
		expect(events.some((event) => event.action === 'access.denied')).toBe(true);
		expect(JSON.stringify(events)).not.toMatch(/password|@example\.test/i);
	});

	it('lists synthetic security events with auth actions only', async () => {
		const {items: events} = await adminMockAPI.listSecurityEvents();

		expect(events.length).toBeGreaterThan(0);
		expect(events.slice(0, 4).map((event) => event.action)).toEqual([
			'auth.login.succeeded',
			'auth.login.failed',
			'auth.mfa.succeeded',
			'auth.logout',
		]);
		expect(events[0]).toEqual(
			expect.objectContaining({
				id: 'demo-security-001',
				practiceId: 'demo-practice-001',
				actorUserId: 'user_mock_practice_admin',
				action: 'auth.login.succeeded',
				resourceType: 'session',
				resourceId: null,
			}),
		);
		expect(events.every((event) => event.action.startsWith('auth.'))).toBe(true);
		expect(events.some((event) => event.action === 'patient.accessed')).toBe(false);
		expect(JSON.stringify(events)).not.toMatch(/password|@example\.test/i);
	});

	it('does not add role-change rows to the security-events list', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		const before = await adminMockAPI.listSecurityEvents();
		await adminMockAPI.assignRole('user_mock_provider', 'NURSE');
		const after = await adminMockAPI.listSecurityEvents();
		expect(after.total).toBe(before.total);
		expect(after.items.some((event) => event.action === 'membership.role_changed')).toBe(false);
	});

	it('assigns a membership role and records membership.role_changed', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		const updated = await adminMockAPI.assignRole('user_mock_provider', 'NURSE');
		expect(updated.role).toBe('NURSE');

		const {items: users} = await adminMockAPI.listUsers();
		expect(users.find((user) => user.id === 'user_mock_provider')?.role).toBe('NURSE');

		const {items: events} = await adminMockAPI.listAuditEvents();
		expect(events[0]).toEqual(
			expect.objectContaining({
				action: 'membership.role_changed',
				resourceType: 'user',
				resourceId: 'user_mock_provider',
				actorUserId: 'user_mock_practice_admin',
			}),
		);
		expect(JSON.stringify(events[0])).not.toMatch(/password|@example\.test/i);
	});

	it('records a unique audit event id for each role change of the same user', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		await adminMockAPI.assignRole('user_mock_provider', 'NURSE');
		await adminMockAPI.assignRole('user_mock_provider', 'PROVIDER');

		const {items: events} = await adminMockAPI.listAuditEvents();
		const roleChanges = events.filter((event) => event.action === 'membership.role_changed');
		expect(roleChanges.length).toBeGreaterThanOrEqual(2);
		expect(roleChanges[0]?.id).not.toBe(roleChanges[1]?.id);
		expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
	});

	it('returns the current user without a new audit event for a same-role PATCH', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		const before = await adminMockAPI.listAuditEvents();
		const updated = await adminMockAPI.assignRole('user_mock_provider', 'PROVIDER');
		expect(updated.role).toBe('PROVIDER');
		const after = await adminMockAPI.listAuditEvents();
		expect(after.total).toBe(before.total);
	});

	it('forbids a PRACTICE_ADMIN from granting SUPER_ADMIN', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		await expect(adminMockAPI.assignRole('user_mock_provider', 'SUPER_ADMIN')).rejects.toBeInstanceOf(
			ApiError,
		);
		await expect(adminMockAPI.assignRole('user_mock_provider', 'SUPER_ADMIN')).rejects.toMatchObject({
			status: 403,
			code: 'FORBIDDEN',
			message: 'You do not have permission to perform this action',
		});
	});

	it('forbids removing the last PRACTICE_ADMIN', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		await expect(
			adminMockAPI.assignRole('user_mock_practice_admin', 'PROVIDER'),
		).rejects.toMatchObject({
			status: 403,
			code: 'FORBIDDEN',
		});
		const {items: users} = await adminMockAPI.listUsers();
		expect(users.find((user) => user.id === 'user_mock_practice_admin')?.role).toBe(
			'PRACTICE_ADMIN',
		);
	});

	it('returns not found for an unknown user id', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		await expect(adminMockAPI.assignRole('user_mock_missing', 'NURSE')).rejects.toMatchObject({
			status: 404,
			code: 'NOT_FOUND',
		});
	});

	describe('paging and filters', () => {
		it('returns 25 rows per page with total, hasMore and nextPage', async () => {
			const first = await adminMockAPI.listAuditEvents({page: 1});
			expect(first.items).toHaveLength(25);
			expect(first.total).toBeGreaterThan(50);
			expect(first.hasMore).toBe(true);
			expect(first.nextPage).toBe(2);

			const last = await adminMockAPI.listAuditEvents({page: Math.ceil(first.total / 25)});
			expect(last.hasMore).toBe(false);
			expect(last.nextPage).toBeUndefined();
			expect(last.items.length).toBeLessThanOrEqual(25);
		});

		it('returns an empty page with the same total past the end', async () => {
			const first = await adminMockAPI.listAuditEvents({page: 1});
			const past = await adminMockAPI.listAuditEvents({page: 99});
			expect(past.items).toEqual([]);
			expect(past.total).toBe(first.total);
			expect(past.hasMore).toBe(false);
		});

		it('filters by action and resource type and counts only matches', async () => {
			const result = await adminMockAPI.listAuditEvents({
				page: 1,
				action: 'patient.accessed',
				resourceType: 'patient',
			});
			expect(result.total).toBeGreaterThan(0);
			expect(
				result.items.every((e) => e.action === 'patient.accessed' && e.resourceType === 'patient'),
			).toBe(true);
		});

		it('filters by an inclusive UTC day range', async () => {
			const result = await adminMockAPI.listAuditEvents({
				page: 1,
				from: '2026-09-26',
				to: '2026-09-26',
			});
			expect(result.total).toBeGreaterThan(0);
			expect(result.items.every((e) => e.createdAt.startsWith('2026-09-26'))).toBe(true);
		});

		it('rejects a reversed date range like the API does', async () => {
			await expect(
				adminMockAPI.listAuditEvents({page: 1, from: '2026-10-05', to: '2026-10-01'}),
			).rejects.toMatchObject({status: 400, code: 'VALIDATION_ERROR'});
		});

		it('pages security events and keeps them auth.* only', async () => {
			const result = await adminMockAPI.listSecurityEvents({page: 1});
			expect(result.total).toBeGreaterThan(25);
			expect(result.items.every((e) => e.action.startsWith('auth.'))).toBe(true);
		});

		it('searches users by email substring and filters by role', async () => {
			const bySearch = await adminMockAPI.listUsers({page: 1, q: 'DEMO.USER.00'});
			expect(bySearch.total).toBeGreaterThan(0);
			expect(bySearch.items.every((u) => u.email.includes('demo.user.00'))).toBe(true);

			const byRole = await adminMockAPI.listUsers({page: 1, role: 'PRACTICE_ADMIN'});
			expect(byRole.total).toBe(1);
			expect(byRole.items[0]?.id).toBe('user_mock_practice_admin');
		});
	});
});
