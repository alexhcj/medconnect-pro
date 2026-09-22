import {beforeEach, describe, expect, it} from 'vitest';
import {ApiError} from '@/lib/api/http';
import {clearMockSession, readMockSession} from '@/lib/api/mocks/mock-session-store';
import {sessionMockAPI} from '@/lib/api/mocks/session-mock';
import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';

describe('sessionMockAPI', () => {
	beforeEach(() => {
		clearMockSession();
	});

	it('rejects unknown credentials', async () => {
		await expect(sessionMockAPI.login('nobody@example.test', 'wrong-password')).rejects.toMatchObject({
			status: 401,
		});
		expect(readMockSession()).toBeNull();
	});

	it('establishes a PRACTICE_ADMIN session for the demo account', async () => {
		const demo = fixtureDemoUsers[0];
		const session = await sessionMockAPI.login(demo.email, demo.password);
		expect(session.userRole).toBe('PRACTICE_ADMIN');
		expect(readMockSession()?.userId).toBe(demo.userId);
		await expect(sessionMockAPI.getCurrentSession()).resolves.toMatchObject({
			userId: demo.userId,
		});
	});

	it('clears the session on logout', async () => {
		const demo = fixtureDemoUsers[0];
		await sessionMockAPI.login(demo.email, demo.password);
		await sessionMockAPI.logout();
		expect(readMockSession()).toBeNull();
		await expect(sessionMockAPI.getCurrentSession()).rejects.toBeInstanceOf(ApiError);
	});
});
