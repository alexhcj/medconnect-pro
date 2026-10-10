import {describe, expect, it} from 'vitest';
import {canAccessTelehealth, canEndTelehealthVisit} from '@/lib/auth/telehealth-access';

describe('telehealth access', () => {
	it('allows clinical nav roles', () => {
		expect(canAccessTelehealth('SUPER_ADMIN')).toBe(true);
		expect(canAccessTelehealth('PRACTICE_ADMIN')).toBe(true);
		expect(canAccessTelehealth('PROVIDER')).toBe(true);
		expect(canAccessTelehealth('NURSE')).toBe(true);
		expect(canAccessTelehealth('PATIENT')).toBe(true);
	});

	it('denies receptionist and a missing role', () => {
		expect(canAccessTelehealth('RECEPTIONIST')).toBe(false);
		expect(canAccessTelehealth(undefined)).toBe(false);
	});
});

describe('canEndTelehealthVisit', () => {
	it('allows roles with write:appointments', () => {
		expect(canEndTelehealthVisit('SUPER_ADMIN')).toBe(true);
		expect(canEndTelehealthVisit('PRACTICE_ADMIN')).toBe(true);
		expect(canEndTelehealthVisit('PROVIDER')).toBe(true);
		expect(canEndTelehealthVisit('RECEPTIONIST')).toBe(true);
	});

	it('hides End for patient, nurse, and a missing role', () => {
		expect(canEndTelehealthVisit('PATIENT')).toBe(false);
		expect(canEndTelehealthVisit('NURSE')).toBe(false);
		expect(canEndTelehealthVisit(undefined)).toBe(false);
	});
});
