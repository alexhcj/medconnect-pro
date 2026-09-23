import type {SessionInfo} from '@/types/auth/session';
import {MOCK_TOKEN_STORAGE_KEY} from '@/lib/api/mocks/mock-session-store';

const LIVE_SESSION_STORAGE_KEY = 'mcp_live_session';
const LIVE_REFRESH_STORAGE_KEY = 'mcp_live_refresh';

export interface LiveSessionRecord {
	session: SessionInfo;
	refreshToken: string;
}

export function readLiveSession(): LiveSessionRecord | null {
	if (typeof window === 'undefined') {
		return null;
	}
	const raw = window.localStorage.getItem(LIVE_SESSION_STORAGE_KEY);
	const refreshToken = window.localStorage.getItem(LIVE_REFRESH_STORAGE_KEY);
	const accessToken = window.localStorage.getItem(MOCK_TOKEN_STORAGE_KEY);
	if (!raw || !refreshToken || !accessToken) {
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
		return {session, refreshToken};
	} catch {
		clearLiveSession();
		return null;
	}
}

export function writeLiveSession(session: SessionInfo, accessToken: string, refreshToken: string): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.setItem(LIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
	window.localStorage.setItem(LIVE_REFRESH_STORAGE_KEY, refreshToken);
	window.localStorage.setItem(MOCK_TOKEN_STORAGE_KEY, accessToken);
}

export function clearLiveSession(): void {
	if (typeof window === 'undefined') {
		return;
	}
	window.localStorage.removeItem(LIVE_SESSION_STORAGE_KEY);
	window.localStorage.removeItem(LIVE_REFRESH_STORAGE_KEY);
	window.localStorage.removeItem(MOCK_TOKEN_STORAGE_KEY);
}
