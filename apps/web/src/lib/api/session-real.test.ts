import {afterEach, describe, expect, it, vi} from 'vitest';
import {ApiError, CSRF_HEADER_NAME, ServiceWakingError} from '@/lib/api/http';
import {clearLiveSession, readLiveSession} from '@/lib/api/live-session-store';
import {MOCK_TOKEN_STORAGE_KEY} from '@/lib/api/mocks/mock-session-store';
import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';
import {sessionRealAPI} from '@/lib/api/session-real';

const demo = fixtureDemoUsers[0];
const LIVE_REFRESH_STORAGE_KEY = 'mcp_live_refresh';

function jsonResponse(status: number, body: unknown) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	};
}

function tokenPair(accessToken: string, refreshToken: string) {
	return {
		tokenType: 'Bearer',
		accessToken,
		refreshToken,
		expiresIn: 900,
	};
}

function expectCredentialed(init: RequestInit | undefined) {
	expect(init?.credentials).toBe('include');
	expect(new Headers(init?.headers).get('Authorization')).toBeNull();
}

describe('sessionRealAPI', () => {
	afterEach(() => {
		clearLiveSession();
		document.cookie = 'mcp_csrf=; max-age=0; path=/';
		vi.unstubAllGlobals();
	});

	it('stores practice-admin session metadata without Nest tokens', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse(200, tokenPair('opaque-access', 'opaque-refresh'))),
		);

		const result = await sessionRealAPI.login(demo.email, demo.password);
		expect(result.kind).toBe('session');
		if (result.kind !== 'session') {
			return;
		}
		const session = result.session;

		expect(session.userRole).toBe('PRACTICE_ADMIN');
		expect(session.permissions).toContain('write:demographics');
		expect(window.localStorage.getItem(MOCK_TOKEN_STORAGE_KEY)).toBeNull();
		expect(window.localStorage.getItem(LIVE_REFRESH_STORAGE_KEY)).toBeNull();
		expect(readLiveSession()).toMatchObject({
			userId: demo.userId,
			userRole: 'PRACTICE_ADMIN',
		});
		await expect(sessionRealAPI.getCurrentSession()).resolves.toMatchObject({
			userId: demo.userId,
			userRole: 'PRACTICE_ADMIN',
		});
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/auth/login',
			expect.objectContaining({method: 'POST', credentials: 'include'}),
		);
		expectCredentialed((fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit);
	});

	it('reports a bare 502 from sign-in as a wake, not a sign-in failure', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 502,
				json: async () => {
					throw new Error('not json');
				},
			}),
		);
		await expect(sessionRealAPI.login(demo.email, demo.password)).rejects.toBeInstanceOf(
			ServiceWakingError,
		);
		expect(readLiveSession()).toBeNull();
	});

	it('reports a network failure on MFA verify as a wake', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
		await expect(
			sessionRealAPI.verifyMfa({email: 'mfa.nurse@example.test', code: '135790', mfaToken: 't'}),
		).rejects.toBeInstanceOf(ServiceWakingError);
	});

	it('keeps 401 and an enveloped 5xx as plain API errors on sign-in', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse(401, {error: {code: 'UNAUTHORIZED', message: 'no'}})),
		);
		await expect(sessionRealAPI.login(demo.email, demo.password)).rejects.toMatchObject({status: 401});
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				jsonResponse(503, {error: {code: 'SERVICE_UNAVAILABLE', message: 'x'}}),
			),
		);
		const error = await sessionRealAPI.login(demo.email, demo.password).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error).not.toBeInstanceOf(ServiceWakingError);
	});

	it('stores a provider session with clinical write grants for the live demo provider', async () => {
		const provider = fixtureDemoUsers.find((user) => user.email === 'jordan.ellis@synthetic.example');
		expect(provider).toBeDefined();
		if (!provider) {
			return;
		}

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse(200, tokenPair('provider-access', 'provider-refresh'))),
		);

		const result = await sessionRealAPI.login(provider.email, provider.password);
		expect(result.kind).toBe('session');
		if (result.kind !== 'session') {
			return;
		}
		const session = result.session;

		expect(session.userRole).toBe('PROVIDER');
		expect(session.userId).toBe('11111111-1111-4111-8111-111111111111');
		expect(session.permissions).toContain('write:medical_records');
		expect(session.permissions).toContain('write:vitals');
		expect(window.localStorage.getItem(MOCK_TOKEN_STORAGE_KEY)).toBeNull();
		expect(window.localStorage.getItem(LIVE_REFRESH_STORAGE_KEY)).toBeNull();
	});

	it('returns an MFA challenge without persisting a session', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				jsonResponse(200, {mfaRequired: true, mfaToken: 'opaque-mfa', expiresIn: 300}),
			),
		);

		const result = await sessionRealAPI.login('mfa.nurse@example.test', 'Demo-Mfa-1');
		expect(result).toEqual({kind: 'mfa', mfaToken: 'opaque-mfa', expiresIn: 300});
		expect(readLiveSession()).toBeNull();
		expect(window.localStorage.getItem(MOCK_TOKEN_STORAGE_KEY)).toBeNull();
		expect(window.localStorage.getItem(LIVE_REFRESH_STORAGE_KEY)).toBeNull();
		expect(window.localStorage.getItem('mcp_live_session')).toBeNull();
	});

	it('verifies mock MFA and stores session metadata without Nest tokens', async () => {
		const mfaNurse = fixtureDemoUsers.find((user) => user.email === 'mfa.nurse@example.test');
		expect(mfaNurse).toBeDefined();
		if (!mfaNurse) {
			return;
		}

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse(200, tokenPair('mfa-access', 'mfa-refresh'))),
		);

		const session = await sessionRealAPI.verifyMfa({
			email: mfaNurse.email,
			code: '135790',
			mfaToken: 'opaque-mfa',
		});

		expect(session.userRole).toBe('NURSE');
		expect(session.userId).toBe(mfaNurse.userId);
		expect(readLiveSession()).toMatchObject({userId: mfaNurse.userId, userRole: 'NURSE'});
		expect(window.localStorage.getItem(MOCK_TOKEN_STORAGE_KEY)).toBeNull();
		expect(window.localStorage.getItem(LIVE_REFRESH_STORAGE_KEY)).toBeNull();
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/auth/mfa/verify',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify({code: '135790', mfaToken: 'opaque-mfa'}),
			}),
		);
		expectCredentialed((fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit);
	});

	it('does not persist a session when MFA verification fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				jsonResponse(401, {
					error: {code: 'UNAUTHENTICATED', message: 'MFA verification failed'},
				}),
			),
		);

		await expect(
			sessionRealAPI.verifyMfa({
				email: 'mfa.nurse@example.test',
				code: '000000',
				mfaToken: 'opaque-mfa',
			}),
		).rejects.toMatchObject({status: 401, message: 'MFA verification failed'});
		expect(readLiveSession()).toBeNull();
	});

	it('refreshes the cookie session without calling Next session stubs', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce(jsonResponse(200, tokenPair('opaque-access', 'opaque-refresh'))),
		);
		await sessionRealAPI.login(demo.email, demo.password);

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse(200, tokenPair('rotated-access', 'rotated-refresh'))),
		);

		const extended = await sessionRealAPI.extendSession();
		expect(extended.success).toBe(true);
		expect(extended.token).toBeUndefined();
		expect(window.localStorage.getItem(MOCK_TOKEN_STORAGE_KEY)).toBeNull();
		expect(window.localStorage.getItem(LIVE_REFRESH_STORAGE_KEY)).toBeNull();
		expect(readLiveSession()?.userId).toBe(demo.userId);
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/auth/refresh',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify({}),
			}),
		);

		await sessionRealAPI.sendActivity([]);
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('clears the local session after logout', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce(jsonResponse(200, tokenPair('opaque-access', 'opaque-refresh'))),
		);
		await sessionRealAPI.login(demo.email, demo.password);
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 204,
				json: async () => ({}),
			}),
		);

		await sessionRealAPI.logout();
		expect(readLiveSession()).toBeNull();
		expect(window.localStorage.getItem(MOCK_TOKEN_STORAGE_KEY)).toBeNull();
		await expect(sessionRealAPI.getCurrentSession()).rejects.toMatchObject({status: 401});
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/auth/logout',
			expect.objectContaining({method: 'POST', credentials: 'include'}),
		);
	});

	it('recovers an empty store from GET /auth/session with the server role', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				jsonResponse(200, {
					userId: '22222222-2222-4222-8222-222222222222',
					email: 'oauth.user@example.test',
					role: 'NURSE',
					practiceId: '33333333-3333-4333-8333-333333333333',
					expiresIn: 600,
				}),
			),
		);

		const session = await sessionRealAPI.getCurrentSession();
		expect(session).toMatchObject({userId: '22222222-2222-4222-8222-222222222222', userRole: 'NURSE'});
		expect(readLiveSession()?.userRole).toBe('NURSE');
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/auth/session',
			expect.objectContaining({method: 'GET', credentials: 'include'}),
		);
		expectCredentialed((fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit);
		const stored = Object.keys(window.localStorage).map((key) => window.localStorage.getItem(key) ?? '');
		expect(stored.join('')).not.toMatch(/token/i);
	});

	it('returns 401 when the server has no session', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				jsonResponse(401, {error: {code: 'UNAUTHENTICATED', message: 'Unauthorized'}}),
			),
		);

		await expect(sessionRealAPI.hydrateSession()).rejects.toMatchObject({status: 401});
		expect(readLiveSession()).toBeNull();
	});

	it('maps Nest session inventory without IP, location, or browser', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				jsonResponse(200, [
					{
						sessionId: '11111111-1111-4111-8111-111111111111',
						createdAt: '2026-10-11T08:00:00.000Z',
						lastActivityAt: '2026-10-11T09:00:00.000Z',
						isCurrent: true,
						ipAddress: '203.0.113.10',
						location: 'Amsterdam',
						userAgent: 'Mozilla/5.0',
					},
					{
						sessionId: '22222222-2222-4222-8222-222222222222',
						createdAt: '2026-10-10T08:00:00.000Z',
						lastActivityAt: 'not-a-date',
						isCurrent: false,
						deviceClass: 'mobile',
					},
				]),
			),
		);

		const sessions = await sessionRealAPI.checkConcurrentSessions();
		expect(sessions).toEqual([
			{
				sessionId: '11111111-1111-4111-8111-111111111111',
				device: 'This session',
				loginTime: Date.parse('2026-10-11T08:00:00.000Z'),
				lastActivity: Date.parse('2026-10-11T09:00:00.000Z'),
				isCurrentSession: true,
			},
			{
				sessionId: '22222222-2222-4222-8222-222222222222',
				device: 'Mobile',
				loginTime: Date.parse('2026-10-10T08:00:00.000Z'),
				lastActivity: 0,
				isCurrentSession: false,
			},
		]);
		expect(JSON.stringify(sessions)).not.toMatch(/203\.0\.113\.10|Amsterdam|Mozilla/);
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/auth/sessions',
			expect.objectContaining({credentials: 'include'}),
		);
		const stored = Object.keys(window.localStorage).map((key) => window.localStorage.getItem(key) ?? '');
		expect(stored.join('')).not.toMatch(/token/i);
	});

	it('revokes other sessions without clearing the current live session', async () => {
		document.cookie = 'mcp_csrf=hosted-csrf';
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce(jsonResponse(200, tokenPair('opaque-access', 'opaque-refresh'))),
		);
		await sessionRealAPI.login(demo.email, demo.password);
		const fetchMock = vi.fn().mockResolvedValue({ok: true, status: 204});
		vi.stubGlobal('fetch', fetchMock);

		await sessionRealAPI.terminateSessions(['other-session', 'third session']);
		expect(readLiveSession()?.userId).toBe(demo.userId);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			'http://localhost:3001/auth/sessions/other-session/revoke',
			expect.objectContaining({method: 'POST', credentials: 'include'}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			'http://localhost:3001/auth/sessions/third%20session/revoke',
			expect.objectContaining({method: 'POST', credentials: 'include'}),
		);
		const firstInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
		expect(new Headers(firstInit.headers).get(CSRF_HEADER_NAME)).toBe('hosted-csrf');
		expect(fetchMock.mock.calls.map((call) => call[0])).not.toContain('http://localhost:3001/auth/logout-all');
	});

	it('leaves live session metadata in place when revoke fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce(jsonResponse(200, tokenPair('opaque-access', 'opaque-refresh'))),
		);
		await sessionRealAPI.login(demo.email, demo.password);
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse(404, {error: {code: 'NOT_FOUND', message: 'Not found'}})),
		);

		await expect(sessionRealAPI.terminateSessions(['missing-session'])).rejects.toBeInstanceOf(ApiError);
		expect(readLiveSession()?.userId).toBe(demo.userId);
	});

	it('logs out everywhere through Nest logout-all and clears local metadata', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce(jsonResponse(200, tokenPair('opaque-access', 'opaque-refresh'))),
		);
		await sessionRealAPI.login(demo.email, demo.password);
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 204,
			}),
		);

		await sessionRealAPI.logoutEverywhere();
		expect(readLiveSession()).toBeNull();
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/auth/logout-all',
			expect.objectContaining({method: 'POST', credentials: 'include'}),
		);
	});
});
