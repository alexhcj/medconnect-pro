import {apiFetch} from '@/lib/api/http';
import {notificationMockAPI} from '@/lib/api/mocks/notification-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {nestApiBaseUrl} from '@/lib/api/nest-api';
import {
	inboxNotificationFromRdo,
	notificationPreferenceFromRdo,
	type NotificationListRdo,
	type NotificationPreferenceRdo,
	type NotificationRdo,
} from '@/lib/api/notification-rdo';
import type {
	InboxNotification,
	NotificationPreference,
	NotificationPreferencePatch,
} from '@/types/notifications/inbox';

function notificationsUrl(path = ''): string {
	return `${nestApiBaseUrl()}/notifications${path}`;
}

export const notificationRealAPI = {
	listInbox: async (): Promise<InboxNotification[]> => {
		const result = await apiFetch<NotificationListRdo>(notificationsUrl());
		return result.notifications.map(inboxNotificationFromRdo);
	},

	markRead: async (id: string): Promise<InboxNotification> => {
		const rdo = await apiFetch<NotificationRdo>(notificationsUrl(`/${id}/read`), {
			method: 'PATCH',
		});
		return inboxNotificationFromRdo(rdo);
	},

	getPreferences: async (): Promise<NotificationPreference> => {
		const rdo = await apiFetch<NotificationPreferenceRdo>(notificationsUrl('/preferences'));
		return notificationPreferenceFromRdo(rdo);
	},

	updatePreferences: async (
		patch: NotificationPreferencePatch,
	): Promise<NotificationPreference> => {
		const rdo = await apiFetch<NotificationPreferenceRdo>(notificationsUrl('/preferences'), {
			method: 'PATCH',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(patch),
		});
		return notificationPreferenceFromRdo(rdo);
	},
};

export const notificationAPI = isMockMode() ? notificationMockAPI : notificationRealAPI;
