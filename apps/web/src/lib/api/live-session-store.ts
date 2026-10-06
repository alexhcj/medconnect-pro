import type {SessionInfo} from '@/types/auth/session';
import {MOCK_TOKEN_STORAGE_KEY} from '@/lib/api/mocks/mock-session-store';

const LIVE_SESSION_STORAGE_KEY = 'mcp_live_session';
const LIVE_REFRESH_STORAGE_KEY = 'mcp_live_refresh';

export function readLiveSession(): SessionInfo | null {
	if (typeof window === 'undefined') {
		return null;
	}
	const raw = window.localStorage.getItem(LIVE_SESSION_STORAGE_KEY);
	if (!raw) {
		return null;
	}
	try {
		const session = JSON.parse(raw) as SessionInfo;
		if (!session?.sessionId || !session.expiresAt) {
			clearLiveSession();
			return null;
		}
		if (session.expiresAt <= Date.now()) {
			clearLiveSession();
			return null;
		}
		return session;
	} catch {
		clearLiveSession();
		return null;
	}
}

export function writeLiveSession(session: SessionInfo): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.setItem(LIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearLiveSession(): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.removeItem(LIVE_SESSION_STORAGE_KEY);
	window.localStorage.removeItem(LIVE_REFRESH_STORAGE_KEY);
	window.localStorage.removeItem(MOCK_TOKEN_STORAGE_KEY);
}
