import {roleHasPermissions} from '../identity/permissions.js';
import type {PracticeRole} from '../tenancy/practice-role.js';

export type BillingReadScope = {kind: 'practice'} | {kind: 'own'};

/**
 * Practice-wide billing is revenue administration. Nurses hold catalog `read:billing` for
 * visit-context amounts only and are denied this surface. Portal users read their own invoices.
 */
export function resolveBillingReadScope(role: PracticeRole): BillingReadScope | 'denied' {
	if (canReadPracticeBilling(role)) {
		return {kind: 'practice'};
	}
	if (canReadOwnBilling(role)) {
		return {kind: 'own'};
	}
	return 'denied';
}

export function canReadPracticeBilling(role: PracticeRole): boolean {
	if (role === 'NURSE' || role === 'PATIENT') {
		return false;
	}
	return roleHasPermissions(role, ['read:billing']);
}

export function canReadOwnBilling(role: PracticeRole): boolean {
	return role === 'PATIENT' && roleHasPermissions(role, ['read:billing']);
}

export function canCreateInvoice(role: PracticeRole): boolean {
	if (role === 'PATIENT' || role === 'NURSE' || role === 'PROVIDER') {
		return false;
	}
	return roleHasPermissions(role, ['write:billing']);
}

export function canRecordPayment(role: PracticeRole): boolean {
	if (role === 'NURSE' || role === 'PROVIDER') {
		return false;
	}
	return roleHasPermissions(role, ['write:billing']);
}
