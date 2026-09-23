import {afterEach, describe, expect, it, vi} from 'vitest';
import {ApiError} from '@/lib/api/http';
import {clearLiveSession, readLiveSession} from '@/lib/api/live-session-store';
import {MOCK_TOKEN_STORAGE_KEY} from '@/lib/api/mocks/mock-session-store';
import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';
import {sessionRealAPI} from '@/lib/api/session-real';

const demo = fixtureDemoUsers[0];

function jsonResponse(status: number, body: unknown) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	};
}

describe('sessionRealAPI', () => {
	afterEach(() => {
		clearLiveSession();
		vi.unstubAllGlobals();
	});

	it('stores the Nest bearer and a practice-admin session for the labeled demo account', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				jsonResponse(200, {
					tokenType: 'Bearer',
					accessToken: 'opaque-access',
					refreshToken: 'opaque-refresh',
					expiresIn: 900,
				}),
			),
		);

		const session = await sessionRealAPI.login(demo.email, demo.password);

		expect(session.userRole).toBe('PRACTICE_ADMIN');
		expect(session.permissions).toContain('write:demographics');
		expect(window.localStorage.getItem(MOCK_TOKEN_STORAGE_KEY)).toBe('opaque-access');
		expect(readLiveSession()?.refreshToken).toBe('opaque-refresh');
		await expect(sessionRealAPI.getCurrentSession()).resolves.toMatchObject({
			userId: demo.userId,
			userRole: 'PRACTICE_ADMIN',
		});
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/auth/login',
			expect.objectContaining({method: 'POST'}),
		);
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

	it('refreshes the bearer without calling Next session stubs', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce(
				jsonResponse(200, {
					tokenType: 'Bearer',
					accessToken: 'opaque-access',
					refreshToken: 'opaque-refresh',
					expiresIn: 900,
				}),
			),
		);
		await sessionRealAPI.login(demo.email, demo.password);

		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(
				jsonResponse(200, {
					tokenType: 'Bearer',
					accessToken: 'rotated-access',
					refreshToken: 'rotated-refresh',
					expiresIn: 900,
				}),
			),
		);

		const extended = await sessionRealAPI.extendSession();
		expect(extended.success).toBe(true);
		expect(extended.token).toBe('rotated-access');
		expect(window.localStorage.getItem(MOCK_TOKEN_STORAGE_KEY)).toBe('rotated-access');
		expect(readLiveSession()?.refreshToken).toBe('rotated-refresh');
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3001/auth/refresh',
			expect.objectContaining({method: 'POST'}),
		);

		await expect(sessionRealAPI.checkConcurrentSessions()).resolves.toEqual([]);
		await sessionRealAPI.sendActivity([]);
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('clears the local session after logout', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValueOnce(
				jsonResponse(200, {
					tokenType: 'Bearer',
					accessToken: 'opaque-access',
					refreshToken: 'opaque-refresh',
					expiresIn: 900,
				}),
			),
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
		await expect(sessionRealAPI.getCurrentSession()).rejects.toMatchObject({status: 401});
	});
});
