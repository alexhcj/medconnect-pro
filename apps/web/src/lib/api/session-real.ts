import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';
import {parseRole} from '@/types/auth/roles';
import type {ActivityEvent, ConcurrentSessionInfo, ExtendSessionResponse, SessionInfo} from '@/types/auth/session';
import {ApiError, apiErrorFromBody, apiFetch, liveRequestInit} from '@/lib/api/http';
import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';
import {clearLiveSession, readLiveSession, writeLiveSession} from '@/lib/api/live-session-store';
import {nestApiBaseUrl} from '@/lib/api/nest-api';

interface TokenPair {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}

function isTokenPair(value: unknown): value is TokenPair {
	if (!value || typeof value !== 'object') {
		return false;
	}
	const body = value as {accessToken?: unknown; refreshToken?: unknown; expiresIn?: unknown};
	return (
		typeof body.accessToken === 'string' &&
		body.accessToken.length > 0 &&
		typeof body.refreshToken === 'string' &&
		body.refreshToken.length > 0 &&
		typeof body.expiresIn === 'number'
	);
}

function isMfaChallenge(value: unknown): boolean {
	return Boolean(value && typeof value === 'object' && (value as {mfaRequired?: unknown}).mfaRequired === true);
}

function sessionForKnownDemo(email: string, expiresIn: number): SessionInfo {
	const account = fixtureDemoUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
	if (!account) {
		throw new ApiError('Unable to sign in. Try again.', 403);
	}
	const userRole = parseRole(account.role) ?? 'PRACTICE_ADMIN';
	const now = Date.now();
	return {
		sessionId: `live_${crypto.randomUUID()}`,
		userId: account.userId,
		userRole,
		expiresAt: now + expiresIn * 1000,
		lastActivity: now,
		isActive: true,
		permissions: [...DEFAULT_ROLE_PERMISSIONS[userRole]],
		currentContext: 'dashboard',
	};
}

async function readJson(response: Response): Promise<unknown> {
	return response.json().catch(() => ({}));
}

export const sessionRealAPI = {
	login: async (email: string, password: string): Promise<SessionInfo> => {
		const response = await fetch(
			`${nestApiBaseUrl()}/auth/login`,
			liveRequestInit({
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({email, password}),
			}),
		);
		const body = await readJson(response);
		if (!response.ok) {
			throw apiErrorFromBody(body, response.status);
		}
		if (isMfaChallenge(body)) {
			throw new ApiError('Unable to sign in. Try again.', 403);
		}
		if (!isTokenPair(body)) {
			throw new ApiError('Unable to sign in. Try again.', 502);
		}
		const session = sessionForKnownDemo(email, body.expiresIn);
		writeLiveSession(session);
		return session;
	},

	logout: async (): Promise<void> => {
		try {
			await apiFetch<void>(`${nestApiBaseUrl()}/auth/logout`, {method: 'POST'});
		} catch (error) {
			console.warn('Live logout error:', error);
		} finally {
			clearLiveSession();
		}
	},

	getCurrentSession: async (): Promise<SessionInfo> => {
		const session = readLiveSession();
		if (!session) {
			throw new ApiError('Unauthorized', 401);
		}
		return session;
	},

	extendSession: async (): Promise<ExtendSessionResponse> => {
		const current = readLiveSession();
		if (!current) {
			throw new ApiError('Unauthorized', 401);
		}
		const body = await apiFetch<unknown>(`${nestApiBaseUrl()}/auth/refresh`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({}),
		});
		if (!isTokenPair(body)) {
			throw new ApiError('Failed to extend session', 502);
		}
		const expiresAt = Date.now() + body.expiresIn * 1000;
		writeLiveSession({...current, expiresAt, lastActivity: Date.now(), isActive: true});
		return {success: true, newExpiresAt: expiresAt};
	},

	checkConcurrentSessions: async (): Promise<ConcurrentSessionInfo[]> => {
		return [];
	},

	terminateSessions: async (_sessionIds: string[]): Promise<void> => {
		try {
			await apiFetch<void>(`${nestApiBaseUrl()}/auth/logout-all`, {method: 'POST'});
		} catch (error) {
			console.warn('Live logout-all error:', error);
			throw error;
		} finally {
			clearLiveSession();
		}
	},

	sendActivity: async (_activities: ActivityEvent[]): Promise<void> => {
		return;
	},

	updateContext: async (context: string): Promise<void> => {
		const current = readLiveSession();
		if (!current) {
			return;
		}
		writeLiveSession({...current, currentContext: context, lastActivity: Date.now()});
	},
};
