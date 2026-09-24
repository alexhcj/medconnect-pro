import {roleHasPermissions} from '../identity/permissions.js';
import type {PracticeRole} from '../tenancy/practice-role.js';

export type AppointmentReadScope = {kind: 'practice'} | {kind: 'assigned'} | {kind: 'own'};

/**
 * Practice-wide schedule access follows write:appointments. Nurses read assigned patients’
 * appointments. Portal users read their own. No separate read:appointments grant exists.
 */
export function resolveAppointmentReadScope(role: PracticeRole): AppointmentReadScope | 'denied' {
	if (roleHasPermissions(role, ['write:appointments'])) {
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

export function canWriteAppointments(role: PracticeRole): boolean {
	return roleHasPermissions(role, ['write:appointments']);
}
