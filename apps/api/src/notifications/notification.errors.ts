export class NotificationNotFoundError extends Error {
	constructor() {
		super('Resource not found');
		this.name = 'NotificationNotFoundError';
	}
}
