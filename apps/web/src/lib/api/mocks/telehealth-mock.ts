import {ApiError} from '@/lib/api/http';
import {readMockSession} from '@/lib/api/mocks/mock-session-store';
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

const MOCK_END_ROLES: ReadonlySet<string> = new Set(['SUPER_ADMIN', 'PRACTICE_ADMIN', 'PROVIDER']);

/** Mock roster: provider, patient and one nurse, like a three-way visit from Nest (BE-027). */
function withMockRoster(session: TelehealthSession): TelehealthSession {
	return {
		...session,
		participants: [
			{userId: `mock-provider-${session.appointmentId}`, displayName: session.providerName, role: 'PROVIDER'},
			{userId: `mock-patient-${session.appointmentId}`, displayName: session.patientName, role: 'PATIENT'},
			{userId: `mock-nurse-${session.appointmentId}`, displayName: 'Nurse (name pending)', role: 'NURSE'},
		],
	};
}

/** The mock host rule mirrors Nest: provider and practice admin end; everyone else leaves. */
function withMockViewer(session: TelehealthSession): TelehealthSession {
	const role = readMockSession()?.userRole;
	return {...session, viewerCanEnd: !!role && MOCK_END_ROLES.has(role)};
}

function present(session: TelehealthSession): TelehealthSession {
	return withMockViewer(withMockRoster(session));
}

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
		return present(existing);
	}
	const session = present(sessionFromAppointment(appointment, 'waiting'));
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

	createSession: async (appointmentId: string): Promise<TelehealthSession> => {
		const appointment = await joinableAppointment(appointmentId);
		return currentOrWaiting(appointment);
	},

	getSession: async (sessionId: string): Promise<TelehealthSession> => {
		const appointmentId = appointmentIdFromSessionId(sessionId);
		if (!appointmentId) {
			notFound();
		}
		const existing = sessions.get(sessionId);
		if (existing?.state === 'ended') {
			return present(existing);
		}
		const appointment = await joinableAppointment(appointmentId);
		return currentOrWaiting(appointment);
	},

	joinSession: async (sessionId: string): Promise<TelehealthSession> => {
		const session = await telehealthMockAPI.getSession(sessionId);
		if (session.state === 'ended') {
			throw new ApiError('A telehealth session for this appointment has already ended.', 409, {
				code: 'SESSION_ENDED',
			});
		}
		const next: TelehealthSession = {...session, state: 'in_session', joinedAt: new Date().toISOString()};
		sessions.set(session.id, next);
		return present(next);
	},

	heartbeat: async (_sessionId: string): Promise<void> => undefined,

	endSession: async (sessionId: string): Promise<TelehealthSession> => {
		const appointmentId = appointmentIdFromSessionId(sessionId);
		if (!appointmentId) {
			notFound();
		}
		const appointment = await joinableAppointment(appointmentId);
		const existing = sessions.get(sessionId) ?? sessionFromAppointment(appointment, 'waiting');
		const next: TelehealthSession = {...existing, state: 'ended', endedAt: new Date().toISOString()};
		sessions.set(sessionId, next);
		return present(next);
	},
};
