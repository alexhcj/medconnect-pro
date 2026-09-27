import {describe, expect, it, vi} from 'vitest';
import type {Notification} from '../persistence/entities/notification.entity.js';
import {DELIVERY_BACKOFF_MS} from './delivery-bus.js';
import type {EmailSender} from './email-sender.js';
import {InProcessDeliveryBus} from './in-process-delivery-bus.js';
import type {NotificationRepository} from './notification.repository.js';
import type {SmsSender} from './sms-sender.js';

const notificationId = '00000000-0000-4000-8000-0000000000aa';
const now = new Date('2026-09-27T12:00:00.000Z');

function pendingEmail(overrides: Partial<Notification> = {}): Notification {
	return {
		id: notificationId,
		practiceId: '00000000-0000-4000-8000-000000000001',
		recipientUserId: '00000000-0000-4000-8000-000000000010',
		channel: 'email',
		type: 'generic',
		title: 'Appointment updated',
		body: 'Your visit time changed.',
		status: 'pending',
		attemptCount: 0,
		lastAttemptAt: null,
		deliveredAt: null,
		readAt: null,
		synthetic: true,
		...overrides,
	} as Notification;
}

describe('InProcessDeliveryBus', () => {
	it('retries with backoff then marks delivered', async () => {
		let current = pendingEmail();
		const notifications = {
			getById: vi.fn().mockImplementation(async () => current),
			updateDelivery: vi.fn().mockImplementation(async (_id: string, update: Partial<Notification>) => {
				current = {...current, ...update} as Notification;
			}),
		};
		const email: EmailSender = {
			send: vi
				.fn()
				.mockRejectedValueOnce(new Error('transient'))
				.mockResolvedValueOnce(undefined),
		};
		const sms: SmsSender = {send: vi.fn()};
		const delays: number[] = [];
		const bus = new InProcessDeliveryBus(
			notifications as unknown as NotificationRepository,
			email,
			sms,
			{now: () => now},
			async (ms) => {
				delays.push(ms);
			},
		);

		await bus.enqueue({notificationId});
		expect(email.send).toHaveBeenCalledTimes(2);
		expect(delays).toEqual([DELIVERY_BACKOFF_MS[0]]);
		expect(current.status).toBe('delivered');
		expect(current.attemptCount).toBe(2);
		expect(sms.send).not.toHaveBeenCalled();
	});

	it('marks failed after three attempts', async () => {
		let current = pendingEmail();
		const notifications = {
			getById: vi.fn().mockImplementation(async () => current),
			updateDelivery: vi.fn().mockImplementation(async (_id: string, update: Partial<Notification>) => {
				current = {...current, ...update} as Notification;
			}),
		};
		const email: EmailSender = {send: vi.fn().mockRejectedValue(new Error('down'))};
		const delays: number[] = [];
		const bus = new InProcessDeliveryBus(
			notifications as unknown as NotificationRepository,
			email,
			{send: vi.fn()},
			{now: () => now},
			async (ms) => {
				delays.push(ms);
			},
		);

		await bus.enqueue({notificationId});
		expect(email.send).toHaveBeenCalledTimes(3);
		expect(delays).toEqual([DELIVERY_BACKOFF_MS[0], DELIVERY_BACKOFF_MS[1]]);
		expect(current.status).toBe('failed');
		expect(current.attemptCount).toBe(3);
	});
});
