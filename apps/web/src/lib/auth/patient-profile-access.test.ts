import {describe, expect, it} from 'vitest';
import {
	canViewMedicalRecords,
	canViewPatientProfile,
	canViewVitals,
} from '@/lib/auth/patient-profile-access';
import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';

describe('patient profile access', () => {
	it('lets staff with a patient-read grant open the profile', () => {
		expect(canViewPatientProfile(DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN)).toBe(true);
		expect(canViewPatientProfile(DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN)).toBe(true);
		expect(canViewPatientProfile(DEFAULT_ROLE_PERMISSIONS.PROVIDER)).toBe(true);
		expect(canViewPatientProfile(DEFAULT_ROLE_PERMISSIONS.NURSE)).toBe(true);
		expect(canViewPatientProfile(DEFAULT_ROLE_PERMISSIONS.RECEPTIONIST)).toBe(true);
	});

	it('does not open the staff profile for a patient-portal grant alone', () => {
		expect(canViewPatientProfile(DEFAULT_ROLE_PERMISSIONS.PATIENT)).toBe(false);
		expect(canViewPatientProfile(undefined)).toBe(false);
		expect(canViewPatientProfile([])).toBe(false);
	});

	it('shows history, medications, and documents only with write:medical_records', () => {
		expect(canViewMedicalRecords(DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN)).toBe(true);
		expect(canViewMedicalRecords(DEFAULT_ROLE_PERMISSIONS.PROVIDER)).toBe(true);
		expect(canViewMedicalRecords(DEFAULT_ROLE_PERMISSIONS.NURSE)).toBe(false);
		expect(canViewMedicalRecords(DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN)).toBe(false);
		expect(canViewMedicalRecords(DEFAULT_ROLE_PERMISSIONS.RECEPTIONIST)).toBe(false);
		expect(canViewMedicalRecords(DEFAULT_ROLE_PERMISSIONS.PATIENT)).toBe(false);
	});

	it('shows vitals only with write:vitals', () => {
		expect(canViewVitals(DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN)).toBe(true);
		expect(canViewVitals(DEFAULT_ROLE_PERMISSIONS.PROVIDER)).toBe(true);
		expect(canViewVitals(DEFAULT_ROLE_PERMISSIONS.NURSE)).toBe(true);
		expect(canViewVitals(DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN)).toBe(false);
		expect(canViewVitals(DEFAULT_ROLE_PERMISSIONS.RECEPTIONIST)).toBe(false);
		expect(canViewVitals(DEFAULT_ROLE_PERMISSIONS.PATIENT)).toBe(false);
	});
});