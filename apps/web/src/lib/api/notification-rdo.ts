import type {
	InboxNotification,
	InboxNotificationType,
	NotificationPreference,
} from '@/types/notifications/inbox';

/** In-app row returned by Nest `NotificationRdo`. Inbox list is `in_app` only. */
export interface NotificationRdo {
	id: string;
	practiceId: string;
	channel: 'in_app';
	type: InboxNotificationType;
	title: string;
	body: string;
	status: 'pending' | 'delivered' | 'failed';
	readAt: string | null;
	createdAt: string;
	synthetic: boolean;
}

export interface NotificationListRdo {
	notifications: NotificationRdo[];
}

/** Preferences returned by Nest `NotificationPreferenceRdo`. */
export interface NotificationPreferenceRdo {
	practiceId: string;
	userId: string;
	inAppEnabled: boolean;
	emailEnabled: boolean;
	smsEnabled: boolean;
	synthetic: boolean;
}

export function inboxNotificationFromRdo(rdo: NotificationRdo): InboxNotification {
	return {
		id: rdo.id,
		type: rdo.type,
		title: rdo.title,
		body: rdo.body,
		readAt: rdo.readAt,
		createdAt: rdo.createdAt,
	};
}

export function notificationPreferenceFromRdo(
	rdo: NotificationPreferenceRdo,
): NotificationPreference {
	return {
		inAppEnabled: rdo.inAppEnabled,
		emailEnabled: rdo.emailEnabled,
		smsEnabled: rdo.smsEnabled,
	};
}
