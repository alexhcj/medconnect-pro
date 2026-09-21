/**
 * Permission catalog aligned with docs/contracts/identity-and-access.md.
 * Browser checks using these strings are UX only; the server is authoritative.
 */
import type {Role} from '@/types/auth/roles';

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

const PERMISSION_SET = new Set<string>(PERMISSIONS);

export function isPermission(value: string): value is Permission {
	return PERMISSION_SET.has(value);
}

export function parsePermission(value: string | undefined | null): Permission | undefined {
	if (!value) {
		return undefined;
	}
	return isPermission(value) ? value : undefined;
}

/** Default grants per role. Extra grants are a future administration concern. */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
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
