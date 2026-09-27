export type OutboundNotification = {
	notificationId: string;
	recipientUserId: string;
	title: string;
	body: string;
};

export interface EmailSender {
	send(message: OutboundNotification): Promise<void>;
}

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
