import {describe, expect, it, vi} from 'vitest';
import type {AuditEventRepository} from '../audit/audit-event.repository.js';
import type {Notification} from '../persistence/entities/notification.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';
import type {DeliveryBus} from './delivery-bus.js';
import {NotificationNotFoundError} from './notification.errors.js';
import type {NotificationPreferenceRepository} from './notification-preference.repository.js';
import type {NotificationRepository} from './notification.repository.js';
import {NotificationService} from './notification.service.js';

const actorId = '00000000-0000-4000-8000-000000000010';
const otherId = '00000000-0000-4000-8000-000000000011';
const practiceId = '00000000-0000-4000-8000-000000000001';
const otherPractice = '00000000-0000-4000-8000-000000000002';
const notificationId = '00000000-0000-4000-8000-0000000000aa';
const now = new Date('2026-09-27T12:00:00.000Z');

function inboxRow(overrides: Partial<Notification> = {}): Notification {
	return {
		id: notificationId,
		practiceId,
		recipientUserId: actorId,
		channel: 'in_app',
		type: 'generic',
		title: 'Appointment updated',
		body: 'Your visit time changed.',
		status: 'delivered',
		attemptCount: 0,
		lastAttemptAt: null,
		deliveredAt: now,
		readAt: null,
		synthetic: true,
		createdAt: now,
		updatedAt: now,
		...overrides,
	} as Notification;
}

function harness() {
	const tenant = new TenantContext();
	tenant.set({practiceId, actorUserId: actorId, role: 'PROVIDER'});
	const notifications = {
		listInboxForRecipient: vi.fn().mockResolvedValue([inboxRow()]),
		getById: vi.fn().mockResolvedValue(inboxRow()),
		create: vi.fn().mockImplementation(async (input) =>
			inboxRow({
				id: `${input.channel}-id`,
				channel: input.channel,
				status: input.status,
				deliveredAt: input.deliveredAt ?? null,
			}),
		),
		markRead: vi.fn().mockResolvedValue(inboxRow({readAt: now})),
		updateDelivery: vi.fn(),
	};
	const preferences = {
		getForUser: vi.fn().mockResolvedValue(undefined),
		upsertForUser: vi.fn().mockResolvedValue({
			id: 'pref-id',
			practiceId,
			userId: actorId,
			inAppEnabled: true,
			emailEnabled: false,
			smsEnabled: true,
			synthetic: true,
		}),
	};
	const audit = {record: vi.fn().mockResolvedValue({})};
	const bus: DeliveryBus = {enqueue: vi.fn().mockResolvedValue(undefined)};
	const clock = {now: () => now};
	const request = {correlationId: 'cid-notify'} as never;
	const service = new NotificationService(
		notifications as unknown as NotificationRepository,
		preferences as unknown as NotificationPreferenceRepository,
		audit as unknown as AuditEventRepository,
		tenant,
		bus,
		clock,
		request,
	);
	return {service, notifications, preferences, audit, bus, tenant};
}

describe('NotificationService', () => {
	it('lists only the caller inbox and marks own in-app rows read', async () => {
		const {service, notifications} = harness();
		const listed = await service.listOwn();
		expect(listed.notifications).toHaveLength(1);
		expect(listed.notifications[0]?.synthetic).toBe(true);
		expect(notifications.listInboxForRecipient).toHaveBeenCalledWith(actorId);

		const read = await service.markRead(notificationId);
		expect(read.readAt).toBe(now.toISOString());
	});

	it('hides other users’ notifications as not found', async () => {
		const {service, notifications} = harness();
		notifications.getById.mockResolvedValue(inboxRow({recipientUserId: otherId}));
		await expect(service.markRead(notificationId)).rejects.toBeInstanceOf(NotificationNotFoundError);
	});

	it('skips disabled channels and enqueues email and SMS when enabled', async () => {
		const {service, notifications, preferences, bus, audit} = harness();
		preferences.getForUser.mockResolvedValue({
			inAppEnabled: false,
			emailEnabled: true,
			smsEnabled: false,
		});
		await service.enqueue({
			recipientUserId: actorId,
			type: 'generic',
			title: 'Appointment updated',
			body: 'Your visit time changed.',
		});
		expect(notifications.create).toHaveBeenCalledTimes(1);
		expect(notifications.create).toHaveBeenCalledWith(
			expect.objectContaining({channel: 'email', status: 'pending'}),
		);
		expect(bus.enqueue).toHaveBeenCalledTimes(1);
		expect(audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'notification.enqueued',
				resourceType: 'notification',
				resourceId: 'email-id',
				correlationId: 'cid-notify',
			}),
		);
		expect(JSON.stringify(audit.record.mock.calls[0])).not.toMatch(
			/Appointment updated|visit time|title|body/i,
		);
	});

	it('audits enqueue with a null resource when every channel is skipped', async () => {
		const {service, notifications, preferences, bus, audit} = harness();
		preferences.getForUser.mockResolvedValue({
			inAppEnabled: false,
			emailEnabled: false,
			smsEnabled: false,
		});
		await service.enqueue({
			recipientUserId: actorId,
			type: 'generic',
			title: 'Appointment updated',
			body: 'Your visit time changed.',
		});
		expect(notifications.create).not.toHaveBeenCalled();
		expect(bus.enqueue).not.toHaveBeenCalled();
		expect(audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'notification.enqueued',
				resourceType: 'notification',
				resourceId: null,
				correlationId: 'cid-notify',
			}),
		);
		expect(JSON.stringify(audit.record.mock.calls[0])).not.toMatch(
			/Appointment updated|visit time|title|body/i,
		);
	});

	it('rejects a client practice id on preference update and enqueue', async () => {
		const {service} = harness();
		await expect(
			service.updatePreferences({emailEnabled: false, practiceId: otherPractice}),
		).rejects.toBeInstanceOf(TenantMismatchError);
		await expect(
			service.enqueue({
				recipientUserId: actorId,
				type: 'generic',
				title: 'Appointment updated',
				body: 'Your visit time changed.',
				practiceId: otherPractice,
			}),
		).rejects.toBeInstanceOf(TenantMismatchError);
	});

	it('audits preference updates without title or body', async () => {
		const {service, audit} = harness();
		const updated = await service.updatePreferences({emailEnabled: false});
		expect(updated.emailEnabled).toBe(false);
		expect(audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'notification_preference.updated',
				resourceType: 'notification_preference',
				resourceId: 'pref-id',
				correlationId: 'cid-notify',
			}),
		);
		expect(JSON.stringify(audit.record.mock.calls[0])).not.toMatch(
			/Appointment updated|visit time|title|body/i,
		);
	});
});
