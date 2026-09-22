import type {PracticeRole} from '../tenancy/practice-role.js';

/**
 * Permission catalog aligned with docs/contracts/identity-and-access.md.
 * Server checks are authoritative. Do not import the frontend catalog.
 */
export const PERMISSIONS = [
	'read:all_patients',
	'read:assigned_patients',
	'read:demographics',
	'read:own_patient',
	'write:demographics',
	'write:medical_records',
	'write:vitals',
	'write:appointments',
	'read:billing',
	'write:billing',
	'admin:practice',
	'admin:users',
	'admin:global',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<PracticeRole, readonly Permission[]> = {
	SUPER_ADMIN: PERMISSIONS,
	PRACTICE_ADMIN: [
		'read:all_patients',
		'read:demographics',
		'write:demographics',
		'write:appointments',
		'read:billing',
		'write:billing',
		'admin:practice',
		'admin:users',
	],
	PROVIDER: [
		'read:all_patients',
		'read:assigned_patients',
		'write:medical_records',
		'write:vitals',
		'write:appointments',
		'read:billing',
	],
	NURSE: ['read:assigned_patients', 'write:vitals', 'read:billing'],
	RECEPTIONIST: [
		'read:demographics',
		'write:demographics',
		'write:appointments',
		'read:billing',
		'write:billing',
	],
	PATIENT: ['read:own_patient', 'read:billing', 'write:billing'],
};

function expandGrants(grants: readonly Permission[]): Set<Permission> {
	const expanded = new Set<Permission>(grants);
	if (expanded.has('read:all_patients')) {
		expanded.add('read:assigned_patients');
		expanded.add('read:demographics');
	}
	return expanded;
}

export function roleHasPermissions(
	role: PracticeRole,
	required: readonly Permission[],
): boolean {
	const granted = expandGrants(DEFAULT_ROLE_PERMISSIONS[role]);
	return required.every((permission) => granted.has(permission));
}
