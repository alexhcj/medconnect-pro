import {Appointment} from '@/types/medical/appointment';
import {TelehealthSession, TelehealthSessionState} from '@/types/medical/telehealth-session';

const SESSION_ID_PREFIX = 'session-';

export function isJoinableTelehealthAppointment(
	appointment: Pick<Appointment, 'type' | 'state'>,
): boolean {
	return (
		appointment.type === 'telehealth' &&
		(appointment.state === 'scheduled' || appointment.state === 'confirmed')
	);
}

export function telehealthSessionId(appointmentId: string): string {
	return `${SESSION_ID_PREFIX}${appointmentId}`;
}

export function appointmentIdFromSessionId(sessionId: string): string | undefined {
	if (!sessionId.startsWith(SESSION_ID_PREFIX)) {
		return undefined;
	}
	const appointmentId = sessionId.slice(SESSION_ID_PREFIX.length);
	return appointmentId || undefined;
}

export function telehealthSessionPath(appointmentId: string): string {
	return `/dashboard/telehealth/${telehealthSessionId(appointmentId)}`;
}

export function sessionFromAppointment(
	appointment: Appointment,
	state: TelehealthSessionState = 'waiting',
): TelehealthSession {
	return {
		id: telehealthSessionId(appointment.id),
		appointmentId: appointment.id,
		patientName: appointment.patientName,
		providerName: appointment.providerName,
		start: appointment.start,
		end: appointment.end,
		type: appointment.type,
		state,
		synthetic: true,
	};
}
