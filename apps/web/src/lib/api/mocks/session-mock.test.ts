import {beforeEach, describe, expect, it} from 'vitest';
import {ApiError} from '@/lib/api/http';
import {clearMockSession, readMockSession} from '@/lib/api/mocks/mock-session-store';
import {sessionMockAPI, sessionMockFactories} from '@/lib/api/mocks/session-mock';
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

	it('rate-limits the demo trigger email with retry seconds', async () => {
		await expect(sessionMockAPI.login('Rate.Limited@example.test', 'anything-123')).rejects.toMatchObject({
			status: 429,
			code: 'RATE_LIMITED',
			retryAfterSeconds: 60,
		});
		expect(readMockSession()).toBeNull();
	});

	it('establishes a PRACTICE_ADMIN session for the demo account', async () => {
		const demo = fixtureDemoUsers[0];
		const result = await sessionMockAPI.login(demo.email, demo.password);
		expect(result.kind).toBe('session');
		if (result.kind !== 'session') {
			return;
		}
		expect(result.session.userRole).toBe('PRACTICE_ADMIN');
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

	it('defaults concurrent sessions to one labeled current demo session', () => {
		const sessions = sessionMockFactories.createMockConcurrentSessions();
		expect(sessions).toHaveLength(1);
		expect(sessions[0]).toMatchObject({
			isCurrentSession: true,
			location: 'Amsterdam, Netherlands',
			browser: 'Chrome 120.0',
			ipAddress: '94.211.158.42',
		});
	});

	it('clears the local mock session on logout everywhere', async () => {
		const demo = fixtureDemoUsers[0];
		await sessionMockAPI.login(demo.email, demo.password);
		await sessionMockAPI.logoutEverywhere();
		expect(readMockSession()).toBeNull();
	});
});
