import {ApiError, apiFetch} from '@/lib/api/http';
import {medicalRealAPI} from '@/lib/api/medical-api';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {telehealthMockAPI} from '@/lib/api/mocks/telehealth-mock';
import {nestApiBaseUrl} from '@/lib/api/nest-api';
import {sessionFromRdo, type TelehealthSessionRdo} from '@/lib/api/telehealth-rdo';
import {isJoinableTelehealthAppointment, sessionFromAppointment} from '@/lib/telehealth/joinable';
import {TelehealthSession} from '@/types/medical/telehealth-session';

export interface TelehealthMediaToken {
	roomUrl: string;
	token: string;
}

function mediaTokenFromNest(body: unknown): TelehealthMediaToken {
	if (!body || typeof body !== 'object') {
		throw new ApiError('Live media is currently unavailable.', 502, {code: 'MEDIA_UNAVAILABLE'});
	}
	const roomUrl = (body as {roomUrl?: unknown}).roomUrl;
	const token = (body as {token?: unknown}).token;
	if (typeof roomUrl !== 'string' || typeof token !== 'string' || !roomUrl || !token) {
		throw new ApiError('Live media is currently unavailable.', 502, {code: 'MEDIA_UNAVAILABLE'});
	}
	return {roomUrl, token};
}

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

	mintMediaToken: async (sessionId: string): Promise<TelehealthMediaToken> => {
		const body = await apiFetch<unknown>(telehealthSessionsUrl(`/${sessionId}/media-token`), {
			method: 'POST',
		});
		return mediaTokenFromNest(body);
	},
};

export const telehealthAPI = isMockMode() ? telehealthMockAPI : telehealthRealAPI;
