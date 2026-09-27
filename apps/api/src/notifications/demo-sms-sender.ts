import {Injectable, Logger} from '@nestjs/common';
import type {OutboundNotification} from './email-sender.js';
import type {SmsSender} from './sms-sender.js';

/**
 * In-process SMS stand-in. Does not call a carrier or persist phone numbers.
 */
@Injectable()
export class DemoSmsSender implements SmsSender {
	private readonly logger = new Logger(DemoSmsSender.name);

	async send(message: OutboundNotification): Promise<void> {
		this.logger.log(`demo sms delivered ${message.notificationId}`);
	}
}
