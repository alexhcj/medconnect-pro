import {describe, expect, it} from 'vitest';
import {canAccessBillingDashboard} from '@/lib/auth/billing-access';

describe('billing access', () => {
	it('allows billing nav roles', () => {
		expect(canAccessBillingDashboard('SUPER_ADMIN')).toBe(true);
		expect(canAccessBillingDashboard('PRACTICE_ADMIN')).toBe(true);
		expect(canAccessBillingDashboard('PROVIDER')).toBe(true);
		expect(canAccessBillingDashboard('RECEPTIONIST')).toBe(true);
		expect(canAccessBillingDashboard('PATIENT')).toBe(true);
	});

	it('denies nurse and a missing role', () => {
		expect(canAccessBillingDashboard('NURSE')).toBe(false);
		expect(canAccessBillingDashboard(undefined)).toBe(false);
	});
});
