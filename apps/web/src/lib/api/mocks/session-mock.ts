import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';
import {parseRole, type Role} from '@/types/auth/roles';
import {ActivityEvent, ConcurrentSessionInfo, ExtendSessionResponse, SessionInfo} from '@/types/auth/session';
import {ApiError} from '@/lib/api/http';
import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';
import {
	clearMockSession,
	MOCK_SESSION_TOKEN,
	readMockSession,
	writeMockSession,
} from '@/lib/api/mocks/mock-session-store';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';

const MOCK_SESSION_ID = 'sess_mock_123456789';
const MOCK_USER_ID = 'user_mock_987654321';

function createMockSession(overrides: Partial<SessionInfo> = {}): SessionInfo {
	const userRole = (overrides.userRole ?? 'PRACTICE_ADMIN') as Role;
	return {
		sessionId: MOCK_SESSION_ID,
		userId: MOCK_USER_ID,
		userRole,
		expiresAt: Date.now() + 24 * 60 * 60 * 1000,
		lastActivity: Date.now() - 5 * 60 * 1000,
		isActive: true,
		permissions: [...(DEFAULT_ROLE_PERMISSIONS[userRole] ?? DEFAULT_ROLE_PERMISSIONS.PRACTICE_ADMIN)],
		currentContext: 'dashboard',
		...overrides,
	};
}

function createMockConcurrentSessions(): ConcurrentSessionInfo[] {
	const now = Date.now();
	const session = readMockSession();
	const sessionId = session?.sessionId ?? MOCK_SESSION_ID;
	return [
		{
			sessionId,
			location: 'Amsterdam, Netherlands',
			device: 'Desktop',
			browser: 'Chrome 120.0',
			ipAddress: '94.211.158.42',
			loginTime: now - 3 * 60 * 60 * 1000,
			lastActivity: now - 5 * 60 * 1000,
			isCurrentSession: true,
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
	login: async (email: string, password: string): Promise<SessionInfo> => {
		await mockDelay();
		const match = fixtureDemoUsers.find(
			(user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password,
		);
		if (!match) {
			mockLog('warn', 'Mock login rejected');
			throw new ApiError('Invalid email or password', 401);
		}
		const role = parseRole(match.role) ?? 'PRACTICE_ADMIN';
		const session = createMockSession({
			userId: match.userId,
			userRole: role,
			permissions: [...DEFAULT_ROLE_PERMISSIONS[role]],
			lastActivity: Date.now(),
		});
		writeMockSession(session);
		mockLog('info', 'Mock login succeeded', match.email);
		return session;
	},

	logout: async (): Promise<void> => {
		await mockDelay();
		clearMockSession();
		mockLog('info', 'Mock logout');
	},

	getCurrentSession: async (): Promise<SessionInfo> => {
		await mockDelay();
		const session = readMockSession();
		if (!session) {
			throw new ApiError('Unauthorized', 401);
		}
		return session;
	},

	extendSession: async (): Promise<ExtendSessionResponse> =>
		withMock(() => {
			const current = readMockSession();
			if (!current) {
				throw new ApiError('Unauthorized', 401);
			}
			const newExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
			const next = {...current, expiresAt: newExpiresAt, lastActivity: Date.now()};
			writeMockSession(next);
			return {
				success: true,
				newExpiresAt,
				token: MOCK_SESSION_TOKEN,
			};
		}, 'Mock: Failed to extend session'),

	checkConcurrentSessions: async (): Promise<ConcurrentSessionInfo[]> => {
		await mockDelay();
		if (!readMockSession()) {
			throw new ApiError('Unauthorized', 401);
		}
		if (shouldSimulateError()) {
			mockLog('warn', 'Mock: Failed to check concurrent sessions');
			throw new Error('Mock: Failed to check concurrent sessions');
		}
		return createMockConcurrentSessions();
	},

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
			const current = readMockSession();
			if (current) {
				writeMockSession({...current, currentContext: context, lastActivity: Date.now()});
			}
			mockLog('info', 'Context updated', context);
		}, 'Mock: Failed to update context'),
};

export const sessionMockFactories = {
	createMockSession,
	createMockConcurrentSessions,
};
