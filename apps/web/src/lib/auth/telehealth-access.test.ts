import {describe, expect, it} from 'vitest';
import {canAccessTelehealth} from '@/lib/auth/telehealth-access';

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
