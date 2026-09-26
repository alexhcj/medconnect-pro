import {ApiError} from '@/lib/api/http';
import {medicalMockAPI} from '@/lib/api/mocks/medical-mock';
import {
	appointmentIdFromSessionId,
	isJoinableTelehealthAppointment,
	sessionFromAppointment,
	telehealthSessionId,
} from '@/lib/telehealth/joinable';
import {Appointment} from '@/types/medical/appointment';
import {TelehealthSession} from '@/types/medical/telehealth-session';

const sessions = new Map<string, TelehealthSession>();

function notFound(): never {
	throw new ApiError('Telehealth session was not found.', 404, {code: 'NOT_FOUND'});
}

async function joinableAppointment(appointmentId: string): Promise<Appointment> {
	const appointments = await medicalMockAPI.listAppointments();
	const appointment = appointments.find((item) => item.id === appointmentId);
	if (!appointment || !isJoinableTelehealthAppointment(appointment)) {
		notFound();
	}
	return appointment;
}

function currentOrWaiting(appointment: Appointment): TelehealthSession {
	const id = telehealthSessionId(appointment.id);
	const existing = sessions.get(id);
	if (existing && existing.state !== 'ended') {
		return existing;
	}
	const session = sessionFromAppointment(appointment, 'waiting');
	sessions.set(id, session);
	return session;
}

export function resetTelehealthMockSessions() {
	sessions.clear();
}

export const telehealthMockAPI = {
	listJoinableVisits: async (): Promise<TelehealthSession[]> => {
		const appointments = await medicalMockAPI.listAppointments();
		return appointments
			.filter(isJoinableTelehealthAppointment)
			.map((appointment) => currentOrWaiting(appointment));
	},

	getSession: async (sessionId: string): Promise<TelehealthSession> => {
		const appointmentId = appointmentIdFromSessionId(sessionId);
		if (!appointmentId) {
			notFound();
		}
		const appointment = await joinableAppointment(appointmentId);
		return currentOrWaiting(appointment);
	},

	joinSession: async (sessionId: string): Promise<TelehealthSession> => {
		const session = await telehealthMockAPI.getSession(sessionId);
		const next: TelehealthSession = {...session, state: 'in_session'};
		sessions.set(session.id, next);
		return next;
	},

	leaveSession: async (sessionId: string): Promise<TelehealthSession> => {
		const appointmentId = appointmentIdFromSessionId(sessionId);
		if (!appointmentId) {
			notFound();
		}
		const appointment = await joinableAppointment(appointmentId);
		const existing = sessions.get(sessionId) ?? sessionFromAppointment(appointment, 'waiting');
		const next: TelehealthSession = {...existing, state: 'ended'};
		sessions.set(sessionId, next);
		return next;
	},
};
