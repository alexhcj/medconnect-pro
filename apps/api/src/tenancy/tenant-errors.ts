export class TenantScopeMissingError extends Error {
	constructor() {
		super('Tenant scope is required');
		this.name = 'TenantScopeMissingError';
	}
}

export class TenantMismatchError extends Error {
	constructor() {
		super('Client-supplied practice id does not match server tenant scope');
		this.name = 'TenantMismatchError';
	}
}
