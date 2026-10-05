import {formatDistance} from 'date-fns';
import type {InboxNotification, InboxNotificationType} from '@/types/notifications/inbox';
import {isInboxUnread} from '@/types/notifications/inbox';

export function unreadCount(notifications: readonly InboxNotification[] | undefined): number {
	if (!notifications) {
		return 0;
	}
	return notifications.filter(isInboxUnread).length;
}

export function notificationBellLabel(count: number): string {
	if (count <= 0) {
		return 'Notifications';
	}
	if (count > 9) {
		return 'Notifications, 9+ unread';
	}
	return `Notifications, ${count} unread`;
}

export function notificationBadgeText(count: number): string | null {
	if (count <= 0) {
		return null;
	}
	if (count > 9) {
		return '9+';
	}
	return String(count);
}

export function notificationTypeLabel(type: InboxNotificationType): string {
	return type === 'appointment_changed' ? 'Appointment' : 'General';
}

export function formatInboxTimestamp(createdAt: string, now = new Date()): string {
	const created = new Date(createdAt);
	if (Number.isNaN(created.getTime())) {
		return createdAt;
	}
	return formatDistance(created, now, {addSuffix: true});
}
