import {apiFetch} from '@/lib/api/http';
import {medicalRealAPI} from '@/lib/api/medical-api';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {telehealthMockAPI} from '@/lib/api/mocks/telehealth-mock';
import {nestApiBaseUrl} from '@/lib/api/nest-api';
import {sessionFromRdo, type TelehealthSessionRdo} from '@/lib/api/telehealth-rdo';
import {isJoinableTelehealthAppointment, sessionFromAppointment} from '@/lib/telehealth/joinable';
import {TelehealthSession} from '@/types/medical/telehealth-session';

function telehealthSessionsUrl(path = ''): string {
	return `${nestApiBaseUrl()}/telehealth/sessions${path}`;
}

async function sessionFromNest(path: string, init?: RequestInit): Promise<TelehealthSession> {
	const rdo = await apiFetch<TelehealthSessionRdo>(telehealthSessionsUrl(path), init);
	return sessionFromRdo(rdo);
}

export const telehealthRealAPI = {
	listJoinableVisits: async (): Promise<TelehealthSession[]> => {
		const appointments = await medicalRealAPI.listAppointments();
		return appointments
			.filter(isJoinableTelehealthAppointment)
			.map((appointment) => sessionFromAppointment(appointment, 'waiting'));
	},

	createSession: async (appointmentId: string): Promise<TelehealthSession> => {
		return sessionFromNest('', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({appointmentId}),
		});
	},

	getSession: async (sessionId: string): Promise<TelehealthSession> => {
		return sessionFromNest(`/${sessionId}`);
	},

	joinSession: async (sessionId: string): Promise<TelehealthSession> => {
		return sessionFromNest(`/${sessionId}/join`, {method: 'POST'});
	},

	leaveSession: async (sessionId: string): Promise<TelehealthSession> => {
		return sessionFromNest(`/${sessionId}/end`, {method: 'POST'});
	},
};

export const telehealthAPI = isMockMode() ? telehealthMockAPI : telehealthRealAPI;
