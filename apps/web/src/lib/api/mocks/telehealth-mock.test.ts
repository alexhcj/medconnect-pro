import {ApiError} from '@/lib/api/http';
import {clearMockSession, writeMockSession} from '@/lib/api/mocks/mock-session-store';
import type {Role} from '@/types/auth/roles';
import {resetTelehealthMockSessions, telehealthMockAPI} from '@/lib/api/mocks/telehealth-mock';

describe('telehealthMockAPI', () => {
	beforeEach(() => {
		resetTelehealthMockSessions();
	});

	it('lists joinable telehealth visits derived from appointments', async () => {
		const visits = await telehealthMockAPI.listJoinableVisits();

		expect(visits).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: 'session-demo-appointment-002',
					appointmentId: 'demo-appointment-002',
					patientName: 'Taylor Bennett',
					providerName: 'Dr. Casey Walsh',
					type: 'telehealth',
					state: 'waiting',
					synthetic: true,
				}),
				expect.objectContaining({
					id: 'session-demo-appointment-004',
					appointmentId: 'demo-appointment-004',
					patientName: 'Avery Carter',
					providerName: 'Dr. Jordan Ellis',
					type: 'telehealth',
					state: 'waiting',
					synthetic: true,
				}),
			]),
		);
		expect(visits).toHaveLength(2);
	});

	it('creates a derived session from a joinable appointment', async () => {
		const created = await telehealthMockAPI.createSession('demo-appointment-002');
		expect(created).toMatchObject({
			id: 'session-demo-appointment-002',
			appointmentId: 'demo-appointment-002',
			state: 'waiting',
		});
	});

	it('joins then ends a session', async () => {
		const waiting = await telehealthMockAPI.getSession('session-demo-appointment-002');
		expect(waiting.state).toBe('waiting');

		const joined = await telehealthMockAPI.joinSession('session-demo-appointment-002');
		expect(joined.state).toBe('in_session');

		const ended = await telehealthMockAPI.endSession('session-demo-appointment-002');
		expect(ended.state).toBe('ended');
	});

	it('opens an already-live visit with ?mockVisit=in_progress and keeps joinedAt on a repeat join (FE-067)', async () => {
		window.history.pushState({}, '', '/dashboard/telehealth/session-demo-appointment-002?mockVisit=in_progress');
		try {
			const live = await telehealthMockAPI.getSession('session-demo-appointment-002');
			expect(live.state).toBe('in_session');
			expect(live.joinedAt).toBeTruthy();

			const again = await telehealthMockAPI.joinSession('session-demo-appointment-002');
			expect(again.state).toBe('in_session');
			expect(again.joinedAt).toBe(live.joinedAt);
		} finally {
			window.history.pushState({}, '', '/');
		}
	});

	it('keeps an ended session ended on get and rejects rejoin', async () => {
		await telehealthMockAPI.joinSession('session-demo-appointment-002');
		await telehealthMockAPI.endSession('session-demo-appointment-002');

		const next = await telehealthMockAPI.getSession('session-demo-appointment-002');
		expect(next.state).toBe('ended');
		await expect(telehealthMockAPI.joinSession('session-demo-appointment-002')).rejects.toMatchObject({
			status: 409,
			code: 'SESSION_ENDED',
		});
	});

	it('rejects unknown, office-visit, and cancelled session ids', async () => {
		await expect(telehealthMockAPI.getSession('session-missing')).rejects.toMatchObject({
			status: 404,
			code: 'NOT_FOUND',
		});
		await expect(telehealthMockAPI.getSession('session-demo-appointment-001')).rejects.toBeInstanceOf(
			ApiError,
		);
		await expect(telehealthMockAPI.getSession('session-demo-appointment-003')).rejects.toMatchObject({
			status: 404,
		});
		await expect(telehealthMockAPI.getSession('demo-appointment-002')).rejects.toMatchObject({
			status: 404,
		});
	});

	it('returns a three-way mock roster and gates viewerCanEnd by the mock role', async () => {
		const asRole = (userRole: Role) =>
			writeMockSession({
				sessionId: 'mock-session',
				userId: 'mock-user',
				userRole,
				expiresAt: Date.now() + 60_000,
				lastActivity: Date.now(),
				isActive: true,
				permissions: [],
				currentContext: 'mock',
			});
		asRole('PROVIDER');
		const provider = await telehealthMockAPI.getSession('session-demo-appointment-002');
		expect(provider.participants.map((p) => p.role)).toEqual(['PROVIDER', 'PATIENT', 'NURSE']);
		expect(provider.viewerCanEnd).toBe(true);

		asRole('RECEPTIONIST');
		expect((await telehealthMockAPI.getSession('session-demo-appointment-002')).viewerCanEnd).toBe(false);
		asRole('PATIENT');
		expect((await telehealthMockAPI.getSession('session-demo-appointment-002')).viewerCanEnd).toBe(false);
		clearMockSession();
	});

	it('does not expose a media-token method', () => {
		expect(telehealthMockAPI).not.toHaveProperty('mintMediaToken');
	});
});
