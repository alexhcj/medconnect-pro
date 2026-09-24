import {describe, expect, it} from 'vitest';
import {canWriteAppointments} from '@/lib/auth/appointment-access';
import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';

describe('appointment access', () => {
	it('allows create for roles with write:appointments', () => {
		expect(canWriteAppointments(DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN)).toBe(true);
		expect(canWriteAppointments(DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN)).toBe(true);
		expect(canWriteAppointments(DEFAULT_ROLE_PERMISSIONS.PROVIDER)).toBe(true);
		expect(canWriteAppointments(DEFAULT_ROLE_PERMISSIONS.RECEPTIONIST)).toBe(true);
	});

	it('denies create without write:appointments', () => {
		expect(canWriteAppointments(DEFAULT_ROLE_PERMISSIONS.NURSE)).toBe(false);
		expect(canWriteAppointments(DEFAULT_ROLE_PERMISSIONS.PATIENT)).toBe(false);
		expect(canWriteAppointments(undefined)).toBe(false);
		expect(canWriteAppointments([])).toBe(false);
	});
});
