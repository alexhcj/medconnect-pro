export class InvalidCredentialsError extends Error {
	constructor() {
		super('Invalid email or password');
		this.name = 'InvalidCredentialsError';
	}
}

export class SessionInvalidError extends Error {
	constructor() {
		super('Authentication is required');
		this.name = 'SessionInvalidError';
	}
}

export class MfaInvalidError extends Error {
	constructor() {
		super('MFA verification failed');
		this.name = 'MfaInvalidError';
	}
}

export class MembershipUnresolvedError extends Error {
	constructor() {
		super('A practice membership could not be resolved');
		this.name = 'MembershipUnresolvedError';
	}
}

export class PermissionDeniedError extends Error {
	constructor() {
		super('You do not have permission to perform this action');
		this.name = 'PermissionDeniedError';
	}
}
