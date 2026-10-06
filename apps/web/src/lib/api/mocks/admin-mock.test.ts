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
		const users = await adminMockAPI.listUsers();

		expect(users.length).toBeGreaterThan(0);
		expect(users.map((user) => user.role)).toEqual([
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
		const events = await adminMockAPI.listAuditEvents();

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

	it('assigns a membership role and records membership.role_changed', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		const updated = await adminMockAPI.assignRole('user_mock_provider', 'NURSE');
		expect(updated.role).toBe('NURSE');

		const users = await adminMockAPI.listUsers();
		expect(users.find((user) => user.id === 'user_mock_provider')?.role).toBe('NURSE');

		const events = await adminMockAPI.listAuditEvents();
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

		const events = await adminMockAPI.listAuditEvents();
		const roleChanges = events.filter((event) => event.action === 'membership.role_changed');
		expect(roleChanges).toHaveLength(2);
		expect(roleChanges[0]?.id).not.toBe(roleChanges[1]?.id);
		expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
	});

	it('returns the current user without a new audit event for a same-role PATCH', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		const before = await adminMockAPI.listAuditEvents();
		const updated = await adminMockAPI.assignRole('user_mock_provider', 'PROVIDER');
		expect(updated.role).toBe('PROVIDER');
		const after = await adminMockAPI.listAuditEvents();
		expect(after).toHaveLength(before.length);
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
		const users = await adminMockAPI.listUsers();
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
});
