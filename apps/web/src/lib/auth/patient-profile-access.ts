/**
 * UX-only profile visibility. Server authorization remains authoritative.
 * Clinical sections follow write grants because the catalog has no separate clinical read strings.
 */
import type {Permission} from '@/types/auth/permissions';

const STAFF_PROFILE_READ: readonly Permission[] = [
	'read:all_patients',
	'read:assigned_patients',
	'read:demographics',
];

function hasPermission(permissions: readonly Permission[] | undefined, permission: Permission): boolean {
	return permissions?.includes(permission) ?? false;
}

export function canViewPatientProfile(permissions: readonly Permission[] | undefined): boolean {
	return STAFF_PROFILE_READ.some((permission) => hasPermission(permissions, permission));
}

export function canViewMedicalRecords(permissions: readonly Permission[] | undefined): boolean {
	return hasPermission(permissions, 'write:medical_records');
}

export function canViewVitals(permissions: readonly Permission[] | undefined): boolean {
	return hasPermission(permissions, 'write:vitals');
}

export function canWritePatientDemographics(permissions: readonly Permission[] | undefined): boolean {
	return hasPermission(permissions, 'write:demographics');
}
