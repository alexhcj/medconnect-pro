import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {
	Notification,
	type NotificationChannel,
	type NotificationStatus,
	type NotificationType,
} from '../persistence/entities/notification.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export type NotificationWriteInput = {
	recipientUserId: string;
	channel: NotificationChannel;
	type: NotificationType;
	title: string;
	body: string;
	status: NotificationStatus;
	attemptCount?: number;
	lastAttemptAt?: Date | null;
	deliveredAt?: Date | null;
	practiceId?: string;
};

export type NotificationDeliveryUpdate = {
	status: NotificationStatus;
	attemptCount: number;
	lastAttemptAt: Date;
	deliveredAt?: Date | null;
};

@Injectable()
export class NotificationRepository {
	constructor(
		@InjectRepository(Notification)
		private readonly rows: Repository<Notification>,
		private readonly tenant: TenantContext,
	) {}

	async listInboxForRecipient(recipientUserId: string): Promise<Notification[]> {
		const {practiceId} = this.tenant.require();
		return this.rows.find({
			where: {practiceId, recipientUserId, channel: 'in_app'},
			order: {createdAt: 'DESC', id: 'DESC'},
		});
	}

	async getById(id: string): Promise<Notification | undefined> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows.findOne({where: {id, practiceId}});
		return row ?? undefined;
	}

	async create(input: NotificationWriteInput): Promise<Notification> {
		const {practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = this.rows.create({
			practiceId,
			recipientUserId: input.recipientUserId,
			channel: input.channel,
			type: input.type,
			title: input.title,
			body: input.body,
			status: input.status,
			attemptCount: input.attemptCount ?? 0,
			lastAttemptAt: input.lastAttemptAt ?? null,
			deliveredAt: input.deliveredAt ?? null,
			readAt: null,
			synthetic: true,
		});
		return this.rows.save(row);
	}

	async markRead(row: Notification, readAt: Date): Promise<Notification> {
		row.readAt = readAt;
		return this.rows.save(row);
	}

	async updateDelivery(id: string, update: NotificationDeliveryUpdate): Promise<void> {
		const {practiceId} = this.tenant.require();
		await this.rows.update(
			{id, practiceId},
			{
				status: update.status,
				attemptCount: update.attemptCount,
				lastAttemptAt: update.lastAttemptAt,
				deliveredAt: update.deliveredAt ?? null,
			},
		);
	}
}

export function rejectMismatchedPracticeId(
	clientPracticeId: string | undefined,
	scopePracticeId: string,
): void {
	if (clientPracticeId !== undefined && clientPracticeId !== scopePracticeId) {
		throw new TenantMismatchError();
	}
}
