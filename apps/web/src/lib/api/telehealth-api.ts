import {ApiError} from '@/lib/api/http';
import {medicalRealAPI} from '@/lib/api/medical-api';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {telehealthMockAPI} from '@/lib/api/mocks/telehealth-mock';
import {isJoinableTelehealthAppointment, sessionFromAppointment} from '@/lib/telehealth/joinable';
import {TelehealthSession} from '@/types/medical/telehealth-session';

export const TELEHEALTH_API_UNAVAILABLE_MESSAGE = 'Telehealth session API is not available yet.';

function sessionApiUnavailable(): Promise<never> {
	return Promise.reject(
		new ApiError(TELEHEALTH_API_UNAVAILABLE_MESSAGE, 404, {code: 'TELEHEALTH_UNAVAILABLE'}),
	);
}

export const telehealthRealAPI = {
	listJoinableVisits: async (): Promise<TelehealthSession[]> => {
		const appointments = await medicalRealAPI.listAppointments();
		return appointments
			.filter(isJoinableTelehealthAppointment)
			.map((appointment) => sessionFromAppointment(appointment, 'waiting'));
	},

	getSession: async (_sessionId: string): Promise<TelehealthSession> => sessionApiUnavailable(),

	joinSession: async (_sessionId: string): Promise<TelehealthSession> => sessionApiUnavailable(),

	leaveSession: async (_sessionId: string): Promise<TelehealthSession> => sessionApiUnavailable(),
};

export const telehealthAPI = isMockMode() ? telehealthMockAPI : telehealthRealAPI;
