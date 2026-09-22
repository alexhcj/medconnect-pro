import {ActivityEvent, ConcurrentSessionInfo, ExtendSessionResponse, SessionInfo} from '@/types/auth/session';
import {apiFetch} from '@/lib/api/http';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {sessionMockAPI, sessionMockFactories} from '@/lib/api/mocks/session-mock';

const sessionRealAPI = {
	login: async (email: string, password: string): Promise<SessionInfo> => {
		return apiFetch<SessionInfo>('/api/auth/login', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({email, password}),
		});
	},

	logout: async (): Promise<void> => {
		await apiFetch<void>('/api/auth/logout', {method: 'POST'});
	},

	getCurrentSession: async (): Promise<SessionInfo> => {
		return apiFetch<SessionInfo>('/api/auth/session');
	},

	extendSession: async (): Promise<ExtendSessionResponse> => {
		return apiFetch<ExtendSessionResponse>('/api/auth/extend-session', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
		});
	},

	checkConcurrentSessions: async (): Promise<ConcurrentSessionInfo[]> => {
		const data = await apiFetch<{sessions?: ConcurrentSessionInfo[]}>('/api/auth/check-sessions');
		return data.sessions || [];
	},

	terminateSessions: async (sessionIds: string[]): Promise<void> => {
		await apiFetch<void>('/api/auth/terminate-sessions', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({sessionIds}),
		});
	},

	sendActivity: async (activities: ActivityEvent[]): Promise<void> => {
		try {
			await apiFetch<void>('/api/audit/activity', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({activities}),
			});
		} catch (error) {
			console.warn('Activity send error:', error);
		}
	},

	updateContext: async (context: string): Promise<void> => {
		await apiFetch<void>('/api/auth/update-context', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({context}),
		});
	},
};

export const sessionAPI = isMockMode() ? sessionMockAPI : sessionRealAPI;

export const mockUtils = {
	createMockSession: sessionMockFactories.createMockSession,
	createMockConcurrentSessions: sessionMockFactories.createMockConcurrentSessions,
};
