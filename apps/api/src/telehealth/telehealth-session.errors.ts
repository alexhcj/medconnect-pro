export class TelehealthSessionNotFoundError extends Error {
	constructor() {
		super('Resource not found');
		this.name = 'TelehealthSessionNotFoundError';
	}
}

export class InvalidTelehealthAppointmentError extends Error {
	constructor() {
		super('Appointment is not eligible for a telehealth session');
		this.name = 'InvalidTelehealthAppointmentError';
	}
}

export class SessionNotJoinableError extends Error {
	constructor() {
		super('This telehealth session cannot be joined.');
		this.name = 'SessionNotJoinableError';
	}
}

export class SessionAlreadyEndedError extends Error {
	constructor() {
		super('A telehealth session for this appointment has already ended.');
		this.name = 'SessionAlreadyEndedError';
	}
}

export class DailyMediaUnavailableError extends Error {
	constructor() {
		super('Live media is currently unavailable.');
		this.name = 'DailyMediaUnavailableError';
	}
}
