import {isMockMode} from '@/lib/api/mocks/runtime';
import {sessionMockAPI, sessionMockFactories} from '@/lib/api/mocks/session-mock';
import {sessionRealAPI} from '@/lib/api/session-real';

export const sessionAPI = isMockMode() ? sessionMockAPI : sessionRealAPI;

export const mockUtils = {
	createMockSession: sessionMockFactories.createMockSession,
	createMockConcurrentSessions: sessionMockFactories.createMockConcurrentSessions,
};
