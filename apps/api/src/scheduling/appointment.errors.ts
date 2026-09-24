export class AppointmentNotFoundError extends Error {
	constructor() {
		super('Resource not found');
		this.name = 'AppointmentNotFoundError';
	}
}

export class AppointmentConflictError extends Error {
	constructor() {
		super('This time overlaps an existing appointment for the provider.');
		this.name = 'AppointmentConflictError';
	}
}

export class InvalidAppointmentPatientError extends Error {
	constructor() {
		super('Patient must be in this practice');
		this.name = 'InvalidAppointmentPatientError';
	}
}

export class InvalidAppointmentProviderError extends Error {
	constructor() {
		super('Provider must be a provider in this practice');
		this.name = 'InvalidAppointmentProviderError';
	}
}

export class InvalidAppointmentTimeError extends Error {
	constructor() {
		super('End must be after start');
		this.name = 'InvalidAppointmentTimeError';
	}
}
