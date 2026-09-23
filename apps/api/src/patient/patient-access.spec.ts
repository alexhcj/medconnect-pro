import {describe, expect, it} from 'vitest';
import {canWriteDemographics, resolvePatientReadScope} from './patient-access.js';

describe('patient access', () => {
	it('lets practice-wide readers list the tenant', () => {
		expect(resolvePatientReadScope('SUPER_ADMIN')).toEqual({kind: 'practice'});
		expect(resolvePatientReadScope('PRACTICE_ADMIN')).toEqual({kind: 'practice'});
		expect(resolvePatientReadScope('PROVIDER')).toEqual({kind: 'practice'});
		expect(resolvePatientReadScope('RECEPTIONIST')).toEqual({kind: 'practice'});
	});

	it('limits nurses to assigned patients and patients to their own record', () => {
		expect(resolvePatientReadScope('NURSE')).toEqual({kind: 'assigned'});
		expect(resolvePatientReadScope('PATIENT')).toEqual({kind: 'own'});
	});

	it('allows demographic writes only for practice admin and receptionist', () => {
		expect(canWriteDemographics('PRACTICE_ADMIN')).toBe(true);
		expect(canWriteDemographics('RECEPTIONIST')).toBe(true);
		expect(canWriteDemographics('SUPER_ADMIN')).toBe(true);
		expect(canWriteDemographics('PROVIDER')).toBe(false);
		expect(canWriteDemographics('NURSE')).toBe(false);
		expect(canWriteDemographics('PATIENT')).toBe(false);
	});
});
