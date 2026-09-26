export class InvoiceNotFoundError extends Error {
	constructor() {
		super('Resource not found');
		this.name = 'InvoiceNotFoundError';
	}
}

export class InvalidInvoicePatientError extends Error {
	constructor() {
		super('Patient must be in this practice');
		this.name = 'InvalidInvoicePatientError';
	}
}

export class InvoiceAlreadyPaidError extends Error {
	constructor() {
		super('This invoice has already been paid.');
		this.name = 'InvoiceAlreadyPaidError';
	}
}
