import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';
import {parseRole} from '@/types/auth/roles';
import type {ActivityEvent, ConcurrentSessionInfo, ExtendSessionResponse, SessionInfo} from '@/types/auth/session';
import {ApiError, apiErrorFromBody, apiFetch} from '@/lib/api/http';
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
		const response = await fetch(`${nestApiBaseUrl()}/auth/login`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({email, password}),
		});
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
		writeLiveSession(session, body.accessToken, body.refreshToken);
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
		const record = readLiveSession();
		if (!record) {
			throw new ApiError('Unauthorized', 401);
		}
		return record.session;
	},

	extendSession: async (): Promise<ExtendSessionResponse> => {
		const record = readLiveSession();
		if (!record) {
			throw new ApiError('Unauthorized', 401);
		}
		const body = await apiFetch<unknown>(`${nestApiBaseUrl()}/auth/refresh`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({refreshToken: record.refreshToken}),
		});
		if (!isTokenPair(body)) {
			throw new ApiError('Failed to extend session', 502);
		}
		const expiresAt = Date.now() + body.expiresIn * 1000;
		const session = {...record.session, expiresAt, lastActivity: Date.now(), isActive: true};
		writeLiveSession(session, body.accessToken, body.refreshToken);
		return {success: true, newExpiresAt: expiresAt, token: body.accessToken};
	},

	checkConcurrentSessions: async (): Promise<ConcurrentSessionInfo[]> => {
		return [];
	},

	terminateSessions: async (_sessionIds: string[]): Promise<void> => {
		return;
	},

	sendActivity: async (_activities: ActivityEvent[]): Promise<void> => {
		return;
	},

	updateContext: async (context: string): Promise<void> => {
		const record = readLiveSession();
		if (!record) {
			return;
		}
		const accessToken = window.localStorage.getItem('auth_token');
		if (!accessToken) {
			return;
		}
		writeLiveSession(
			{...record.session, currentContext: context, lastActivity: Date.now()},
			accessToken,
			record.refreshToken,
		);
	},
};
