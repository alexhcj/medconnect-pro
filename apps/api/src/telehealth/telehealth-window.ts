import type {AppointmentState, AppointmentType} from '../persistence/entities/appointment.entity.js';

export const TELEHEALTH_GRACE_MS = 15 * 60 * 1000;

export type JoinableAppointment = {
	type: AppointmentType;
	state: AppointmentState;
	endAt: Date;
};

export function isJoinableTelehealthAppointment(appointment: JoinableAppointment): boolean {
	return (
		appointment.type === 'telehealth' &&
		(appointment.state === 'scheduled' || appointment.state === 'confirmed')
	);
}

export function isPastGraceExpiry(endAt: Date, now: Date = new Date()): boolean {
	return now.getTime() > endAt.getTime() + TELEHEALTH_GRACE_MS;
}

export function isWithinJoinWindow(startAt: Date, endAt: Date, now: Date = new Date()): boolean {
	const windowStart = startAt.getTime() - TELEHEALTH_GRACE_MS;
	const windowEnd = endAt.getTime() + TELEHEALTH_GRACE_MS;
	const instant = now.getTime();
	return instant >= windowStart && instant <= windowEnd;
}

export function canCreateTelehealthSession(appointment: JoinableAppointment, now: Date = new Date()): boolean {
	return isJoinableTelehealthAppointment(appointment) && !isPastGraceExpiry(appointment.endAt, now);
}
