import {ActivityEvent, ConcurrentSessionInfo, ExtendSessionResponse, SessionInfo} from '@/types/auth/session';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';

const MOCK_SESSION_ID = 'sess_mock_123456789';
const MOCK_USER_ID = 'user_mock_987654321';

function createMockSession(overrides: Partial<SessionInfo> = {}): SessionInfo {
	return {
		sessionId: MOCK_SESSION_ID,
		userId: MOCK_USER_ID,
		userRole: 'admin',
		expiresAt: Date.now() + 24 * 60 * 60 * 1000,
		lastActivity: Date.now() - 5 * 60 * 1000,
		isActive: true,
		permissions: ['read', 'write', 'admin', 'delete', 'manage_users'],
		currentContext: 'dashboard',
		...overrides,
	};
}

function createMockConcurrentSessions(): ConcurrentSessionInfo[] {
	const now = Date.now();
	return [
		{
			sessionId: MOCK_SESSION_ID,
			location: 'Amsterdam, Netherlands',
			device: 'Desktop',
			browser: 'Chrome 120.0',
			ipAddress: '94.211.158.42',
			loginTime: now - 3 * 60 * 60 * 1000,
			lastActivity: now - 5 * 60 * 1000,
			isCurrentSession: true,
		},
		{
			sessionId: 'sess_mock_987654321',
			location: 'Berlin, Germany',
			device: 'iPhone 15 Pro',
			browser: 'Safari 17.2',
			ipAddress: '185.199.108.153',
			loginTime: now - 6 * 60 * 60 * 1000,
			lastActivity: now - 2 * 60 * 60 * 1000,
			isCurrentSession: false,
		},
		{
			sessionId: 'sess_mock_456789123',
			location: 'London, United Kingdom',
			device: 'MacBook Pro',
			browser: 'Firefox 122.0',
			ipAddress: '217.138.212.58',
			loginTime: now - 12 * 60 * 60 * 1000,
			lastActivity: now - 30 * 60 * 1000,
			isCurrentSession: false,
		},
	];
}

async function withMock<T>(work: () => T, errorMessage: string): Promise<T> {
	await mockDelay();
	if (shouldSimulateError()) {
		mockLog('warn', errorMessage);
		throw new Error(errorMessage);
	}
	return work();
}

export const sessionMockAPI = {
	getCurrentSession: async (): Promise<SessionInfo> =>
		withMock(() => createMockSession(), 'Mock: Failed to fetch session info'),

	extendSession: async (): Promise<ExtendSessionResponse> =>
		withMock(
			() => ({
				success: true,
				newExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
				token: 'mock.extended.session-token',
			}),
			'Mock: Failed to extend session',
		),

	checkConcurrentSessions: async (): Promise<ConcurrentSessionInfo[]> =>
		withMock(() => createMockConcurrentSessions(), 'Mock: Failed to check concurrent sessions'),

	terminateSessions: async (sessionIds: string[]): Promise<void> =>
		withMock(() => {
			mockLog('info', 'Terminated sessions', sessionIds);
		}, 'Mock: Failed to terminate sessions'),

	sendActivity: async (activities: ActivityEvent[]): Promise<void> => {
		await mockDelay(200);
		activities.forEach((activity) => {
			if (!['mouse', 'keyboard', 'click', 'scroll', 'focus'].includes(activity.type)) {
				mockLog('warn', `Invalid activity type: ${activity.type}`);
			}
			if (!activity.timestamp || activity.timestamp > Date.now()) {
				mockLog('warn', `Invalid activity timestamp: ${activity.timestamp}`);
			}
		});
		mockLog(
			'debug',
			'Activity sent',
			activities.map((activity) => ({
				type: activity.type,
				timestamp: new Date(activity.timestamp).toISOString(),
				context: activity.context,
			})),
		);
	},

	updateContext: async (context: string): Promise<void> =>
		withMock(() => {
			mockLog('info', 'Context updated', context);
		}, 'Mock: Failed to update context'),
};

export const sessionMockFactories = {
	createMockSession,
	createMockConcurrentSessions,
};
