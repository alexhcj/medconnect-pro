export class DocumentNotFoundError extends Error {
	constructor() {
		super('Resource not found');
		this.name = 'DocumentNotFoundError';
	}
}

export class DocumentFileInvalidError extends Error {
	constructor(
		readonly path: string,
		message: string,
	) {
		super(message);
		this.name = 'DocumentFileInvalidError';
	}
}
