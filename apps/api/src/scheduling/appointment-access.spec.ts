import {describe, expect, it} from 'vitest';
import {canWriteAppointments, resolveAppointmentReadScope} from './appointment-access.js';

describe('appointment access', () => {
	it('lets writers see the practice schedule', () => {
		expect(resolveAppointmentReadScope('SUPER_ADMIN')).toEqual({kind: 'practice'});
		expect(resolveAppointmentReadScope('PRACTICE_ADMIN')).toEqual({kind: 'practice'});
		expect(resolveAppointmentReadScope('PROVIDER')).toEqual({kind: 'practice'});
		expect(resolveAppointmentReadScope('RECEPTIONIST')).toEqual({kind: 'practice'});
	});

	it('limits nurses to assigned patients and patients to their own appointments', () => {
		expect(resolveAppointmentReadScope('NURSE')).toEqual({kind: 'assigned'});
		expect(resolveAppointmentReadScope('PATIENT')).toEqual({kind: 'own'});
	});

	it('allows appointment writes for staff with write:appointments', () => {
		expect(canWriteAppointments('PRACTICE_ADMIN')).toBe(true);
		expect(canWriteAppointments('PROVIDER')).toBe(true);
		expect(canWriteAppointments('RECEPTIONIST')).toBe(true);
		expect(canWriteAppointments('SUPER_ADMIN')).toBe(true);
		expect(canWriteAppointments('NURSE')).toBe(false);
		expect(canWriteAppointments('PATIENT')).toBe(false);
	});
});
