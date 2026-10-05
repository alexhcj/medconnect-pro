export type InboxNotificationType = 'generic' | 'appointment_changed';

export interface InboxNotification {
	id: string;
	type: InboxNotificationType;
	title: string;
	body: string;
	readAt: string | null;
	createdAt: string;
}

export interface NotificationPreference {
	inAppEnabled: boolean;
	emailEnabled: boolean;
	smsEnabled: boolean;
}

export type NotificationPreferencePatch = Partial<NotificationPreference>;

export function isInboxUnread(notification: InboxNotification): boolean {
	return notification.readAt == null;
}
