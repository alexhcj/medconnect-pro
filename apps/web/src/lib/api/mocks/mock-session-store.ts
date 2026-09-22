import type {SessionInfo} from '@/types/auth/session';

export const MOCK_SESSION_STORAGE_KEY = 'mcp_mock_session';
export const MOCK_TOKEN_STORAGE_KEY = 'auth_token';
export const MOCK_SESSION_TOKEN = 'mock.session-token';

export function readMockSession(): SessionInfo | null {
	if (typeof window === 'undefined') {
		return null;
	}
	const raw = window.localStorage.getItem(MOCK_SESSION_STORAGE_KEY);
	if (!raw) {
		return null;
	}
	try {
		const session = JSON.parse(raw) as SessionInfo;
		if (!session?.sessionId || !session.expiresAt) {
			return null;
		}
		if (session.expiresAt <= Date.now()) {
			clearMockSession();
			return null;
		}
		return session;
	} catch {
		clearMockSession();
		return null;
	}
}

export function writeMockSession(session: SessionInfo, token: string = MOCK_SESSION_TOKEN): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.setItem(MOCK_SESSION_STORAGE_KEY, JSON.stringify(session));
	window.localStorage.setItem(MOCK_TOKEN_STORAGE_KEY, token);
}

export function clearMockSession(): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
	window.localStorage.removeItem(MOCK_TOKEN_STORAGE_KEY);
}
