import {describe, expect, it} from 'vitest';
import {canAccessBillingDashboard, canRecordPayment} from '@/lib/auth/billing-access';

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

	it('allows practice write roles to record a payment', () => {
		expect(canRecordPayment('SUPER_ADMIN')).toBe(true);
		expect(canRecordPayment('PRACTICE_ADMIN')).toBe(true);
		expect(canRecordPayment('RECEPTIONIST')).toBe(true);
		expect(canRecordPayment('PATIENT')).toBe(true);
	});

	it('denies provider and nurse from recording a payment', () => {
		expect(canRecordPayment('PROVIDER')).toBe(false);
		expect(canRecordPayment('NURSE')).toBe(false);
		expect(canRecordPayment(undefined)).toBe(false);
	});
});
