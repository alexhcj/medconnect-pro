import {describe, expect, it} from 'vitest';
import {PRACTICE_ROLES} from '../tenancy/practice-role.js';
import {resolveDisplayName, roleLabel} from './display-name.js';

describe('resolveDisplayName', () => {
	it('uses displayName when set', () => {
		expect(resolveDisplayName({role: 'PROVIDER', displayName: 'Dr. Jordan Ellis'})).toBe(
			'Dr. Jordan Ellis',
		);
	});

	it.each([
		['PROVIDER', 'Provider'],
		['NURSE', 'Nurse'],
		['PRACTICE_ADMIN', 'Practice admin'],
		['SUPER_ADMIN', 'Super admin'],
		['RECEPTIONIST', 'Receptionist'],
		['PATIENT', 'Patient'],
	] as const)('falls back to the %s role label', (role, label) => {
		expect(resolveDisplayName({role, displayName: null})).toBe(label);
		expect(resolveDisplayName({role})).toBe(label);
	});

	it('treats a blank displayName as unset', () => {
		expect(resolveDisplayName({role: 'NURSE', displayName: '   '})).toBe('Nurse');
	});

	it('prefers the patient record name for PATIENT memberships', () => {
		expect(
			resolveDisplayName(
				{role: 'PATIENT', displayName: 'Ignored'},
				{firstName: 'Avery', lastName: 'Quinn'},
			),
		).toBe('Avery Quinn');
	});

	it('ignores patient data for non-patient roles', () => {
		expect(
			resolveDisplayName({role: 'NURSE'}, {firstName: 'Avery', lastName: 'Quinn'}),
		).toBe('Nurse');
	});

	it('has a label for every role and never contains an email', () => {
		for (const role of PRACTICE_ROLES) {
			expect(roleLabel(role)).not.toContain('@');
		}
	});
});
