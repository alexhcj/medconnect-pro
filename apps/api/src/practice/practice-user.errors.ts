export class PracticeUserNotFoundError extends Error {
	constructor() {
		super('Resource not found');
		this.name = 'PracticeUserNotFoundError';
	}
}
