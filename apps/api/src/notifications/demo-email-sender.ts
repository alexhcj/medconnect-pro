import {Injectable, Logger} from '@nestjs/common';
import type {EmailSender, OutboundNotification} from './email-sender.js';

/**
 * In-process email stand-in. Does not call SMTP or persist recipient addresses.
 */
@Injectable()
export class DemoEmailSender implements EmailSender {
	private readonly logger = new Logger(DemoEmailSender.name);

	async send(message: OutboundNotification): Promise<void> {
		this.logger.log(`demo email delivered ${message.notificationId}`);
	}
}
