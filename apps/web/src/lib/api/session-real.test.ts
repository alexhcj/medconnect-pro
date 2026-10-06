import {afterEach, describe, expect, it, vi} from 'vitest';
import {ApiError} from '@/lib/api/http';
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
		vi.unstubAllGlobals();
	});

	it('stores practice-admin session metadata without Nest tokens', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse(200, tokenPair('opaque-access', 'opaque-refresh'))),
		);

		const session = await sessionRealAPI.login(demo.email, demo.password);

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

		const session = await sessionRealAPI.login(provider.email, provider.password);

		expect(session.userRole).toBe('PROVIDER');
		expect(session.userId).toBe('11111111-1111-4111-8111-111111111111');
		expect(session.permissions).toContain('write:medical_records');
		expect(session.permissions).toContain('write:vitals');
		expect(window.localStorage.getItem(MOCK_TOKEN_STORAGE_KEY)).toBeNull();
		expect(window.localStorage.getItem(LIVE_REFRESH_STORAGE_KEY)).toBeNull();
	});

	it('does not persist a session when Nest requires MFA', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				jsonResponse(200, {mfaRequired: true, mfaToken: 'opaque-mfa', expiresIn: 300}),
			),
		);

		await expect(sessionRealAPI.login('mfa.nurse@example.test', 'Demo-Mfa-1')).rejects.toBeInstanceOf(ApiError);
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

		await expect(sessionRealAPI.checkConcurrentSessions()).resolves.toEqual([]);
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

	it('terminates live sessions through Nest logout-all', async () => {
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

		await sessionRealAPI.terminateSessions(['other-session']);
		expect(readLiveSession()).toBeNull();
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/auth/logout-all',
			expect.objectContaining({method: 'POST', credentials: 'include'}),
		);
	});
});
