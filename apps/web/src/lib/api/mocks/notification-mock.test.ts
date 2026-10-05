import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {ApiError} from '@/lib/api/http';
import {
	notificationMockAPI,
	resetNotificationMock,
} from '@/lib/api/mocks/notification-mock';
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

describe('notificationMockAPI', () => {
	beforeEach(() => {
		resetNotificationMock();
		clearMockSession();
	});

	afterEach(() => {
		resetNotificationMock();
		clearMockSession();
	});

	it('lists only the session user’s inbox rows', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		const adminInbox = await notificationMockAPI.listInbox();
		expect(adminInbox.map((item) => item.title)).toEqual([
			'Seeded inbox: census reminder',
			'Seeded inbox: schedule digest',
			'Seeded inbox: billing summary',
			'Appointment scheduled',
		]);
		expect(adminInbox.some((item) => item.title.includes("today's visits"))).toBe(false);

		writeMockSession(sessionFor('user_mock_provider', 'PROVIDER'));
		const providerInbox = await notificationMockAPI.listInbox();
		expect(providerInbox.map((item) => item.title)).toEqual([
			"Seeded inbox: today's visits",
			'Seeded inbox: follow-up queue',
		]);
		expect(providerInbox.some((item) => item.title.includes('census reminder'))).toBe(false);
	});

	it('persists mark-read for the session user and hides other-user ids', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		const unreadId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
		const updated = await notificationMockAPI.markRead(unreadId);
		expect(updated.readAt).toEqual(expect.any(String));

		const after = await notificationMockAPI.listInbox();
		expect(after.find((item) => item.id === unreadId)?.readAt).toEqual(expect.any(String));

		await expect(
			notificationMockAPI.markRead('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'),
		).rejects.toMatchObject({status: 404, code: 'NOT_FOUND'});
		await expect(
			notificationMockAPI.markRead('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'),
		).rejects.toBeInstanceOf(ApiError);
	});

	it('round-trips preference patches in memory', async () => {
		writeMockSession(sessionFor('user_mock_practice_admin', 'PRACTICE_ADMIN'));
		await expect(notificationMockAPI.getPreferences()).resolves.toEqual({
			inAppEnabled: true,
			emailEnabled: true,
			smsEnabled: true,
		});
		const saved = await notificationMockAPI.updatePreferences({emailEnabled: false});
		expect(saved.emailEnabled).toBe(false);
		await expect(notificationMockAPI.getPreferences()).resolves.toMatchObject({
			emailEnabled: false,
			inAppEnabled: true,
			smsEnabled: true,
		});
	});
});
