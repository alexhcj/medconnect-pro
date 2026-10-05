import {ApiError} from '@/lib/api/http';
import {fixtureInboxNotifications} from '@/lib/api/mocks/fixtures';
import {readMockSession} from '@/lib/api/mocks/mock-session-store';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';
import type {
	InboxNotification,
	NotificationPreference,
	NotificationPreferencePatch,
} from '@/types/notifications/inbox';

const DEFAULT_PREFERENCES: NotificationPreference = {
	inAppEnabled: true,
	emailEnabled: true,
	smsEnabled: true,
};

type MutableInboxRow = InboxNotification & {recipientUserId: string};

let inbox: MutableInboxRow[] = structuredClone(fixtureInboxNotifications);
const preferencesByUser = new Map<string, NotificationPreference>();

export function resetNotificationMock(): void {
	inbox = structuredClone(fixtureInboxNotifications);
	preferencesByUser.clear();
}

async function withMock<T>(work: () => T, errorMessage: string): Promise<T> {
	await mockDelay();
	if (shouldSimulateError()) {
		mockLog('warn', errorMessage);
		throw new Error(errorMessage);
	}
	return work();
}

function sessionUserId(): string | undefined {
	return readMockSession()?.userId;
}

function toInboxNotification(row: MutableInboxRow): InboxNotification {
	return {
		id: row.id,
		type: row.type,
		title: row.title,
		body: row.body,
		readAt: row.readAt,
		createdAt: row.createdAt,
	};
}

function notFound(): never {
	throw new ApiError('Notification was not found.', 404, {code: 'NOT_FOUND'});
}

function preferencesFor(userId: string): NotificationPreference {
	const existing = preferencesByUser.get(userId);
	if (existing) {
		return {...existing};
	}
	return {...DEFAULT_PREFERENCES};
}

export const notificationMockAPI = {
	listInbox: async (): Promise<InboxNotification[]> =>
		withMock(() => {
			const userId = sessionUserId();
			if (!userId) {
				return [];
			}
			return inbox
				.filter((row) => row.recipientUserId === userId)
				.sort((a, b) => {
					const byCreated = b.createdAt.localeCompare(a.createdAt);
					return byCreated !== 0 ? byCreated : b.id.localeCompare(a.id);
				})
				.map(toInboxNotification);
		}, 'Mock: Failed to load notifications'),

	markRead: async (id: string): Promise<InboxNotification> =>
		withMock(() => {
			const userId = sessionUserId();
			const row = inbox.find((item) => item.id === id);
			if (!userId || !row || row.recipientUserId !== userId) {
				notFound();
			}
			row.readAt = row.readAt ?? new Date().toISOString();
			return toInboxNotification(row);
		}, 'Mock: Failed to mark notification read'),

	getPreferences: async (): Promise<NotificationPreference> =>
		withMock(() => {
			const userId = sessionUserId();
			if (!userId) {
				return {...DEFAULT_PREFERENCES};
			}
			return preferencesFor(userId);
		}, 'Mock: Failed to load notification preferences'),

	updatePreferences: async (
		patch: NotificationPreferencePatch,
	): Promise<NotificationPreference> =>
		withMock(() => {
			const userId = sessionUserId();
			if (!userId) {
				throw new ApiError('Unauthorized', 401);
			}
			const next = {
				...preferencesFor(userId),
				...patch,
			};
			preferencesByUser.set(userId, next);
			return {...next};
		}, 'Mock: Failed to save notification preferences'),
};
