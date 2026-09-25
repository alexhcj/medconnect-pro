import {roleHasPermissions} from '../identity/permissions.js';
import type {PracticeRole} from '../tenancy/practice-role.js';

export type ClinicalResourceKind = 'history' | 'conditions' | 'medications' | 'vitals';

export function canWriteMedicalRecords(role: PracticeRole): boolean {
	return roleHasPermissions(role, ['write:medical_records']);
}

export function canWriteVitals(role: PracticeRole): boolean {
	return roleHasPermissions(role, ['write:vitals']);
}

/**
 * Clinical reads follow write grants because the catalog has no separate clinical read strings.
 * Portal users may read their own records without a write grant.
 */
export function canReadClinical(role: PracticeRole, resource: ClinicalResourceKind): boolean {
	if (roleHasPermissions(role, ['read:own_patient'])) {
		return true;
	}
	return canWriteClinical(role, resource);
}

export function canWriteClinical(role: PracticeRole, resource: ClinicalResourceKind): boolean {
	if (resource === 'vitals') {
		return canWriteVitals(role);
	}
	return canWriteMedicalRecords(role);
}
