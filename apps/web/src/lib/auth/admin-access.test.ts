import {describe, expect, it} from 'vitest';
import {canAccessAdministration} from '@/lib/auth/admin-access';

describe('administration access', () => {
	it('allows administration nav roles', () => {
		expect(canAccessAdministration('SUPER_ADMIN')).toBe(true);
		expect(canAccessAdministration('PRACTICE_ADMIN')).toBe(true);
	});

	it('denies non-admin and missing roles; nav visibility is UX only', () => {
		expect(canAccessAdministration('PROVIDER')).toBe(false);
		expect(canAccessAdministration('NURSE')).toBe(false);
		expect(canAccessAdministration('RECEPTIONIST')).toBe(false);
		expect(canAccessAdministration('PATIENT')).toBe(false);
		expect(canAccessAdministration(undefined)).toBe(false);
	});
});
