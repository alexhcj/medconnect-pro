import {roleHasPermissions} from '../identity/permissions.js';
import type {PracticeRole} from '../tenancy/practice-role.js';

export type PatientReadScope = {kind: 'practice'} | {kind: 'assigned'} | {kind: 'own'};

/**
 * Practice-wide reads win over narrower grants. `read:all_patients` already expands to
 * demographics, so providers and practice admins list the tenant. Nurses stay on assignment.
 * Patients stay on their own portal record.
 */
export function resolvePatientReadScope(role: PracticeRole): PatientReadScope | 'denied' {
	if (
		roleHasPermissions(role, ['read:all_patients']) ||
		roleHasPermissions(role, ['read:demographics'])
	) {
		return {kind: 'practice'};
	}
	if (roleHasPermissions(role, ['read:assigned_patients'])) {
		return {kind: 'assigned'};
	}
	if (roleHasPermissions(role, ['read:own_patient'])) {
		return {kind: 'own'};
	}
	return 'denied';
}

export function canWriteDemographics(role: PracticeRole): boolean {
	return roleHasPermissions(role, ['write:demographics']);
}
