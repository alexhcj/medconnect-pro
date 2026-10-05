import {
	formatInboxTimestamp,
	notificationBadgeText,
	notificationBellLabel,
	notificationTypeLabel,
	unreadCount,
} from '@/components/notifications/notification-format';
import type {InboxNotification} from '@/types/notifications/inbox';

const sample: InboxNotification[] = [
	{
		id: '1',
		type: 'generic',
		title: 'Unread',
		body: 'Body',
		readAt: null,
		createdAt: '2026-10-05T12:00:00.000Z',
	},
	{
		id: '2',
		type: 'appointment_changed',
		title: 'Read',
		body: 'Body',
		readAt: '2026-10-05T13:00:00.000Z',
		createdAt: '2026-10-05T11:00:00.000Z',
	},
];

describe('notification format helpers', () => {
	it('counts unread rows and labels the Bell without titles or bodies', () => {
		expect(unreadCount(sample)).toBe(1);
		expect(notificationBellLabel(0)).toBe('Notifications');
		expect(notificationBellLabel(3)).toBe('Notifications, 3 unread');
		expect(notificationBellLabel(9)).toBe('Notifications, 9 unread');
		expect(notificationBellLabel(10)).toBe('Notifications, 9+ unread');
		expect(notificationBellLabel(3)).not.toMatch(/census|Appointment scheduled/i);
		expect(notificationBadgeText(0)).toBeNull();
		expect(notificationBadgeText(3)).toBe('3');
		expect(notificationBadgeText(12)).toBe('9+');
	});

	it('maps type chips and relative timestamps', () => {
		expect(notificationTypeLabel('generic')).toBe('General');
		expect(notificationTypeLabel('appointment_changed')).toBe('Appointment');
		expect(formatInboxTimestamp('2026-10-05T10:00:00.000Z', new Date('2026-10-05T12:00:00.000Z'))).toBe(
			'about 2 hours ago',
		);
	});
});
