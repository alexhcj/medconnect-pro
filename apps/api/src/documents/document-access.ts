import {roleHasPermissions} from '../identity/permissions.js';
import type {PracticeRole} from '../tenancy/practice-role.js';

/**
 * Document reads follow write:medical_records because the catalog has no document-read string.
 * Portal users may read their own files without a write grant.
 */
export function canReadDocuments(role: PracticeRole): boolean {
	if (roleHasPermissions(role, ['read:own_patient'])) {
		return true;
	}
	return canUploadDocuments(role);
}

export function canUploadDocuments(role: PracticeRole): boolean {
	return roleHasPermissions(role, ['write:medical_records']);
}
