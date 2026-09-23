export class PatientNotFoundError extends Error {
	constructor() {
		super('Resource not found');
		this.name = 'PatientNotFoundError';
	}
}

export class InvalidProviderAssignmentError extends Error {
	constructor() {
		super('Assigned provider must be a provider in this practice');
		this.name = 'InvalidProviderAssignmentError';
	}
}
