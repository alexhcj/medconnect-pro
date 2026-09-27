import {Inject, Injectable} from '@nestjs/common';
import {REQUEST} from '@nestjs/core';
import type {Request} from 'express';
import {AuditEventRepository} from '../audit/audit-event.repository.js';
import {CLOCK, type Clock} from '../identity/clock.js';
import type {Notification, NotificationType} from '../persistence/entities/notification.entity.js';
import type {NotificationPreference} from '../persistence/entities/notification-preference.entity.js';
import {getCorrelationId} from '../platform/correlation.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {isOwnRecipient} from './notification-access.js';
import {
	DEFAULT_NOTIFICATION_PREFERENCES,
	NotificationPreferenceRepository,
	type NotificationPreferencePatch,
} from './notification-preference.repository.js';
import {NotificationNotFoundError} from './notification.errors.js';
import type {NotificationListRdo, NotificationPreferenceRdo, NotificationRdo} from './notification.rdo.js';
import {NotificationRepository, rejectMismatchedPracticeId} from './notification.repository.js';
import {DELIVERY_BUS, type DeliveryBus} from './delivery-bus.js';

export type NotificationEnqueueInput = {
	recipientUserId: string;
	type: NotificationType;
	title: string;
	body: string;
	practiceId?: string;
};

@Injectable()
export class NotificationService {
	constructor(
		private readonly notifications: NotificationRepository,
		private readonly preferences: NotificationPreferenceRepository,
		private readonly audit: AuditEventRepository,
		private readonly tenant: TenantContext,
		@Inject(DELIVERY_BUS) private readonly bus: DeliveryBus,
		@Inject(CLOCK) private readonly clock: Clock,
		@Inject(REQUEST) private readonly request: Request,
	) {}

	async listOwn(): Promise<NotificationListRdo> {
		const {actorUserId} = this.tenant.require();
		const rows = await this.notifications.listInboxForRecipient(actorUserId);
		return {notifications: rows.map(toNotificationRdo)};
	}

	async markRead(id: string): Promise<NotificationRdo> {
		const {actorUserId} = this.tenant.require();
		const row = await this.notifications.getById(id);
		if (!row || row.channel !== 'in_app' || !isOwnRecipient(actorUserId, row.recipientUserId)) {
			throw new NotificationNotFoundError();
		}
		if (!row.readAt) {
			const saved = await this.notifications.markRead(row, this.clock.now());
			return toNotificationRdo(saved);
		}
		return toNotificationRdo(row);
	}

	async getPreferences(): Promise<NotificationPreferenceRdo> {
		const {actorUserId, practiceId} = this.tenant.require();
		const row = await this.preferences.getForUser(actorUserId);
		return toPreferenceRdo(practiceId, actorUserId, row);
	}

	async updatePreferences(patch: NotificationPreferencePatch): Promise<NotificationPreferenceRdo> {
		const {actorUserId, practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(patch.practiceId, practiceId);
		const saved = await this.preferences.upsertForUser(actorUserId, patch);
		await this.audit.record({
			action: 'notification_preference.updated',
			resourceType: 'notification_preference',
			resourceId: saved.id,
			correlationId: getCorrelationId(this.request),
		});
		return toPreferenceRdo(practiceId, actorUserId, saved);
	}

	async enqueue(input: NotificationEnqueueInput): Promise<void> {
		const {practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(input.practiceId, practiceId);
		const prefs = await this.resolvedPreferences(input.recipientUserId);
		if (prefs.inAppEnabled) {
			await this.notifications.create({
				recipientUserId: input.recipientUserId,
				channel: 'in_app',
				type: input.type,
				title: input.title,
				body: input.body,
				status: 'delivered',
				deliveredAt: this.clock.now(),
				practiceId: input.practiceId,
			});
		}
		if (prefs.emailEnabled) {
			const email = await this.notifications.create({
				recipientUserId: input.recipientUserId,
				channel: 'email',
				type: input.type,
				title: input.title,
				body: input.body,
				status: 'pending',
				practiceId: input.practiceId,
			});
			await this.bus.enqueue({notificationId: email.id});
		}
		if (prefs.smsEnabled) {
			const sms = await this.notifications.create({
				recipientUserId: input.recipientUserId,
				channel: 'sms',
				type: input.type,
				title: input.title,
				body: input.body,
				status: 'pending',
				practiceId: input.practiceId,
			});
			await this.bus.enqueue({notificationId: sms.id});
		}
	}

	private async resolvedPreferences(userId: string) {
		const row = await this.preferences.getForUser(userId);
		if (!row) {
			return DEFAULT_NOTIFICATION_PREFERENCES;
		}
		return {
			inAppEnabled: row.inAppEnabled,
			emailEnabled: row.emailEnabled,
			smsEnabled: row.smsEnabled,
		};
	}
}

function toNotificationRdo(row: Notification): NotificationRdo {
	return {
		id: row.id,
		practiceId: row.practiceId,
		channel: 'in_app',
		type: row.type,
		title: row.title,
		body: row.body,
		status: row.status,
		readAt: row.readAt ? row.readAt.toISOString() : null,
		createdAt: row.createdAt.toISOString(),
		synthetic: true,
	};
}

function toPreferenceRdo(
	practiceId: string,
	userId: string,
	row: NotificationPreference | undefined,
): NotificationPreferenceRdo {
	return {
		practiceId,
		userId,
		inAppEnabled: row?.inAppEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.inAppEnabled,
		emailEnabled: row?.emailEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.emailEnabled,
		smsEnabled: row?.smsEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.smsEnabled,
		synthetic: true,
	};
}
