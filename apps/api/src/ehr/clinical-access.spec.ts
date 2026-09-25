import {describe, expect, it} from 'vitest';
import {canReadClinical, canWriteClinical, canWriteMedicalRecords, canWriteVitals} from './clinical-access.js';

describe('clinical access', () => {
	it('grants medical-record writes to providers and super admins only', () => {
		expect(canWriteMedicalRecords('PROVIDER')).toBe(true);
		expect(canWriteMedicalRecords('SUPER_ADMIN')).toBe(true);
		expect(canWriteMedicalRecords('NURSE')).toBe(false);
		expect(canWriteMedicalRecords('PRACTICE_ADMIN')).toBe(false);
		expect(canWriteMedicalRecords('RECEPTIONIST')).toBe(false);
		expect(canWriteMedicalRecords('PATIENT')).toBe(false);
	});

	it('grants vital writes to providers, nurses, and super admins', () => {
		expect(canWriteVitals('PROVIDER')).toBe(true);
		expect(canWriteVitals('NURSE')).toBe(true);
		expect(canWriteVitals('SUPER_ADMIN')).toBe(true);
		expect(canWriteVitals('PRACTICE_ADMIN')).toBe(false);
		expect(canWriteVitals('RECEPTIONIST')).toBe(false);
		expect(canWriteVitals('PATIENT')).toBe(false);
	});

	it('lets nurses write and read vitals but not history, conditions, or medications', () => {
		expect(canWriteClinical('NURSE', 'vitals')).toBe(true);
		expect(canReadClinical('NURSE', 'vitals')).toBe(true);
		expect(canWriteClinical('NURSE', 'history')).toBe(false);
		expect(canReadClinical('NURSE', 'history')).toBe(false);
		expect(canReadClinical('NURSE', 'conditions')).toBe(false);
		expect(canReadClinical('NURSE', 'medications')).toBe(false);
	});

	it('lets portal users read their own clinical records without write grants', () => {
		expect(canReadClinical('PATIENT', 'history')).toBe(true);
		expect(canReadClinical('PATIENT', 'vitals')).toBe(true);
		expect(canWriteClinical('PATIENT', 'history')).toBe(false);
		expect(canWriteClinical('PATIENT', 'vitals')).toBe(false);
	});

	it('denies clinical reads to demographics-only staff', () => {
		expect(canReadClinical('RECEPTIONIST', 'history')).toBe(false);
		expect(canReadClinical('PRACTICE_ADMIN', 'vitals')).toBe(false);
	});
});
