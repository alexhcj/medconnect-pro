import type {OutboundNotification} from './email-sender.js';

export interface SmsSender {
	send(message: OutboundNotification): Promise<void>;
}

export const SMS_SENDER = Symbol('SMS_SENDER');
