import {DEFAULT_ROLE_PERMISSIONS} from '@/types/auth/permissions';
import {parseRole} from '@/types/auth/roles';
import type {
	ActivityEvent,
	ConcurrentSessionInfo,
	ExtendSessionResponse,
	LoginOutcome,
	MfaChallengeResult,
	SessionInfo,
	VerifyMfaInput,
} from '@/types/auth/session';
import {ApiError, apiFetch, errorFromResponseBody, liveFetch, liveRequestInit} from '@/lib/api/http';
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

function isMfaChallenge(value: unknown): value is {mfaRequired: true; mfaToken: string; expiresIn: number} {
	if (!value || typeof value !== 'object') {
		return false;
	}
	const body = value as {mfaRequired?: unknown; mfaToken?: unknown; expiresIn?: unknown};
	return (
		body.mfaRequired === true &&
		typeof body.mfaToken === 'string' &&
		body.mfaToken.length > 0 &&
		typeof body.expiresIn === 'number'
	);
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

interface ServerSessionInfo {
	userId: string;
	role: string;
	expiresIn: number;
}

function isServerSessionInfo(value: unknown): value is ServerSessionInfo {
	if (!value || typeof value !== 'object') {
		return false;
	}
	const body = value as {userId?: unknown; role?: unknown; expiresIn?: unknown};
	return (
		typeof body.userId === 'string' &&
		body.userId.length > 0 &&
		typeof body.role === 'string' &&
		typeof body.expiresIn === 'number'
	);
}

async function hydrateFromServer(): Promise<SessionInfo> {
	const response = await fetch(`${nestApiBaseUrl()}/auth/session`, liveRequestInit({method: 'GET'}));
	const body = await readJson(response);
	if (!response.ok || !isServerSessionInfo(body)) {
		clearLiveSession();
		throw new ApiError('Unauthorized', 401);
	}
	const userRole = parseRole(body.role);
	if (!userRole) {
		clearLiveSession();
		throw new ApiError('Unauthorized', 401);
	}
	const now = Date.now();
	const session: SessionInfo = {
		sessionId: `live_${crypto.randomUUID()}`,
		userId: body.userId,
		userRole,
		expiresAt: now + body.expiresIn * 1000,
		lastActivity: now,
		isActive: true,
		permissions: [...DEFAULT_ROLE_PERMISSIONS[userRole]],
		currentContext: 'dashboard',
	};
	writeLiveSession(session);
	return session;
}

async function readJson(response: Response): Promise<unknown> {
	return response.json().catch(() => ({}));
}

function deviceLabel(deviceClass: unknown, isCurrent: boolean): string {
	if (deviceClass === 'desktop') {
		return 'Desktop';
	}
	if (deviceClass === 'mobile') {
		return 'Mobile';
	}
	if (deviceClass === 'unknown') {
		return 'Unknown device';
	}
	return isCurrent ? 'This session' : 'Other session';
}

function epochMillis(value: unknown): number {
	if (typeof value !== 'string') {
		return 0;
	}
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

/** Maps a Nest session-inventory row. Drops IP, location, and user-agent if present. */
function mapInventoryItem(value: unknown): ConcurrentSessionInfo | undefined {
	if (!value || typeof value !== 'object') {
		return undefined;
	}
	const body = value as {
		sessionId?: unknown;
		isCurrent?: unknown;
		deviceClass?: unknown;
		createdAt?: unknown;
		lastActivityAt?: unknown;
	};
	if (typeof body.sessionId !== 'string' || body.sessionId.length === 0 || typeof body.isCurrent !== 'boolean') {
		return undefined;
	}
	return {
		sessionId: body.sessionId,
		device: deviceLabel(body.deviceClass, body.isCurrent),
		loginTime: epochMillis(body.createdAt),
		lastActivity: epochMillis(body.lastActivityAt),
		isCurrentSession: body.isCurrent,
	};
}

function persistSession(email: string, expiresIn: number): SessionInfo {
	const session = sessionForKnownDemo(email, expiresIn);
	writeLiveSession(session);
	return session;
}

export const sessionRealAPI = {
	login: async (email: string, password: string): Promise<LoginOutcome> => {
		const response = await liveFetch(
			`${nestApiBaseUrl()}/auth/login`,
			liveRequestInit({
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({email, password}),
			}),
		);
		const body = await readJson(response);
		if (!response.ok) {
			throw errorFromResponseBody(body, response.status);
		}
		if (isMfaChallenge(body)) {
			const challenge: MfaChallengeResult = {
				kind: 'mfa',
				mfaToken: body.mfaToken,
				expiresIn: body.expiresIn,
			};
			return challenge;
		}
		if (!isTokenPair(body)) {
			throw new ApiError('Unable to sign in. Try again.', 502);
		}
		return {kind: 'session', session: persistSession(email, body.expiresIn)};
	},

	verifyMfa: async ({email, code, mfaToken}: VerifyMfaInput): Promise<SessionInfo> => {
		const response = await liveFetch(
			`${nestApiBaseUrl()}/auth/mfa/verify`,
			liveRequestInit({
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({code, mfaToken}),
			}),
		);
		const body = await readJson(response);
		if (!response.ok) {
			throw errorFromResponseBody(body, response.status);
		}
		if (!isTokenPair(body)) {
			throw new ApiError('Unable to sign in. Try again.', 502);
		}
		return persistSession(email, body.expiresIn);
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
		return readLiveSession() ?? hydrateFromServer();
	},

	hydrateSession: (): Promise<SessionInfo> => hydrateFromServer(),

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
		const body = await apiFetch<unknown>(`${nestApiBaseUrl()}/auth/sessions`);
		if (!Array.isArray(body)) {
			throw new ApiError('Unable to load sessions', 502);
		}
		return body.flatMap((item) => {
			const mapped = mapInventoryItem(item);
			return mapped ? [mapped] : [];
		});
	},

	terminateSessions: async (sessionIds: string[]): Promise<void> => {
		for (const sessionId of sessionIds) {
			await apiFetch<void>(`${nestApiBaseUrl()}/auth/sessions/${encodeURIComponent(sessionId)}/revoke`, {
				method: 'POST',
			});
		}
	},

	logoutEverywhere: async (): Promise<void> => {
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
