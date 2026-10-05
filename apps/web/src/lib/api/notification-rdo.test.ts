import {
	inboxNotificationFromRdo,
	notificationPreferenceFromRdo,
	type NotificationPreferenceRdo,
	type NotificationRdo,
} from '@/lib/api/notification-rdo';

const notificationRdo: NotificationRdo = {
	id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
	practiceId: '22222222-2222-4222-8222-222222222222',
	channel: 'in_app',
	type: 'generic',
	title: 'Seeded inbox: census reminder',
	body: 'Harbor Synthetic Practice has new demo patients ready for the overview cards.',
	status: 'delivered',
	readAt: null,
	createdAt: '2026-10-05T16:00:00.000Z',
	synthetic: true,
};

const preferenceRdo: NotificationPreferenceRdo = {
	practiceId: '22222222-2222-4222-8222-222222222222',
	userId: 'user_mock_practice_admin',
	inAppEnabled: true,
	emailEnabled: false,
	smsEnabled: true,
	synthetic: true,
};

describe('notification RDO mappers', () => {
	it('unwraps an inbox row without practiceId, channel, status, or synthetic', () => {
		expect(inboxNotificationFromRdo(notificationRdo)).toEqual({
			id: notificationRdo.id,
			type: 'generic',
			title: notificationRdo.title,
			body: notificationRdo.body,
			readAt: null,
			createdAt: notificationRdo.createdAt,
		});
		expect(inboxNotificationFromRdo(notificationRdo)).not.toHaveProperty('practiceId');
		expect(inboxNotificationFromRdo(notificationRdo)).not.toHaveProperty('synthetic');
		expect(inboxNotificationFromRdo(notificationRdo)).not.toHaveProperty('channel');
		expect(inboxNotificationFromRdo(notificationRdo)).not.toHaveProperty('status');
	});

	it('unwraps preferences without practiceId, userId, or synthetic', () => {
		expect(notificationPreferenceFromRdo(preferenceRdo)).toEqual({
			inAppEnabled: true,
			emailEnabled: false,
			smsEnabled: true,
		});
		expect(notificationPreferenceFromRdo(preferenceRdo)).not.toHaveProperty('practiceId');
		expect(notificationPreferenceFromRdo(preferenceRdo)).not.toHaveProperty('userId');
		expect(notificationPreferenceFromRdo(preferenceRdo)).not.toHaveProperty('synthetic');
	});
});
