/** Canonical roles; scopes and grants are in docs/contracts/identity-and-access.md. */
export const ROLES = [
	'SUPER_ADMIN',
	'PRACTICE_ADMIN',
	'PROVIDER',
	'NURSE',
	'RECEPTIONIST',
	'PATIENT',
] as const;

export type Role = (typeof ROLES)[number];

const ROLE_SET = new Set<string>(ROLES);

export function isRole(value: string): value is Role {
	return ROLE_SET.has(value);
}

export function parseRole(value: string | undefined | null): Role | undefined {
	if (!value) {
		return undefined;
	}
	return isRole(value) ? value : undefined;
}
