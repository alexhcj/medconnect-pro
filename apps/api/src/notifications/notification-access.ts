export function isOwnRecipient(actorUserId: string, recipientUserId: string): boolean {
	return actorUserId === recipientUserId;
}
