import {Inject, Injectable, Logger} from '@nestjs/common';
import {CLOCK, type Clock} from '../identity/clock.js';
import type {NotificationChannel} from '../persistence/entities/notification.entity.js';
import {EMAIL_SENDER, type EmailSender} from './email-sender.js';
import {
	DELIVERY_BACKOFF_MS,
	DELIVERY_BUS,
	DELIVERY_MAX_ATTEMPTS,
	DELIVERY_SLEEP,
	type DeliveryBus,
	type DeliveryJob,
	type DeliverySleep,
} from './delivery-bus.js';
import {NotificationRepository} from './notification.repository.js';
import {SMS_SENDER, type SmsSender} from './sms-sender.js';

/**
 * Local SNS/SQS stand-in. Processes email/SMS jobs in-process with retry.
 * Target infrastructure remains SNS fan-out to SQS workers.
 */
@Injectable()
export class InProcessDeliveryBus implements DeliveryBus {
	private readonly logger = new Logger(InProcessDeliveryBus.name);

	constructor(
		private readonly notifications: NotificationRepository,
		@Inject(EMAIL_SENDER) private readonly email: EmailSender,
		@Inject(SMS_SENDER) private readonly sms: SmsSender,
		@Inject(CLOCK) private readonly clock: Clock,
		@Inject(DELIVERY_SLEEP) private readonly sleep: DeliverySleep,
	) {}

	async enqueue(job: DeliveryJob): Promise<void> {
		await this.deliver(job);
	}

	async deliver(job: DeliveryJob): Promise<void> {
		for (let attempt = 1; attempt <= DELIVERY_MAX_ATTEMPTS; attempt += 1) {
			const row = await this.notifications.getById(job.notificationId);
			if (!row || row.status === 'delivered' || row.status === 'failed') {
				return;
			}
			if (row.channel === 'in_app') {
				return;
			}
			try {
				await this.send(row.channel, {
					notificationId: row.id,
					recipientUserId: row.recipientUserId,
					title: row.title,
					body: row.body,
				});
				await this.notifications.updateDelivery(row.id, {
					status: 'delivered',
					attemptCount: attempt,
					lastAttemptAt: this.clock.now(),
					deliveredAt: this.clock.now(),
				});
				return;
			} catch (error) {
				const lastAttemptAt = this.clock.now();
				if (attempt >= DELIVERY_MAX_ATTEMPTS) {
					await this.notifications.updateDelivery(row.id, {
						status: 'failed',
						attemptCount: attempt,
						lastAttemptAt,
					});
					this.logger.error(`delivery exhausted ${job.notificationId}`, errorFrom(error));
					return;
				}
				await this.notifications.updateDelivery(row.id, {
					status: 'pending',
					attemptCount: attempt,
					lastAttemptAt,
				});
				await this.sleep(DELIVERY_BACKOFF_MS[attempt - 1] ?? DELIVERY_BACKOFF_MS[2]);
			}
		}
	}

	private send(channel: NotificationChannel, message: Parameters<EmailSender['send']>[0]) {
		if (channel === 'email') {
			return this.email.send(message);
		}
		if (channel === 'sms') {
			return this.sms.send(message);
		}
		return Promise.resolve();
	}
}

function errorFrom(error: unknown): string {
	return error instanceof Error ? error.message : 'unknown';
}

export const inProcessDeliveryBusProvider = {
	provide: DELIVERY_BUS,
	useClass: InProcessDeliveryBus,
};
