import {afterEach, describe, expect, it, vi} from 'vitest';
import type {AppointmentRdo} from '@/lib/api/appointment-rdo';
import {LIVE_DEMO_PROVIDER_ID} from '@/lib/api/live-demo-provider';
import {telehealthRealAPI} from '@/lib/api/telehealth-api';
import type {TelehealthSessionRdo} from '@/lib/api/telehealth-rdo';

const appointmentId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const sessionId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

const telehealthAppointmentRdo: AppointmentRdo = {
	id: appointmentId,
	practiceId: '22222222-2222-4222-8222-222222222222',
	patientId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
	providerId: LIVE_DEMO_PROVIDER_ID,
	start: '2026-10-16T16:00:00.000Z',
	end: '2026-10-16T16:30:00.000Z',
	type: 'telehealth',
	state: 'confirmed',
	patientName: 'Avery Quinn',
	providerName: 'jordan.ellis@synthetic.example',
	synthetic: true,
};

const officeRdo: AppointmentRdo = {
	...telehealthAppointmentRdo,
	id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
	type: 'office_visit',
	state: 'scheduled',
};

const sessionRdo: TelehealthSessionRdo = {
	id: sessionId,
	appointmentId,
	practiceId: telehealthAppointmentRdo.practiceId,
	patientId: telehealthAppointmentRdo.patientId,
	providerId: LIVE_DEMO_PROVIDER_ID,
	patientName: 'Avery Quinn',
	providerName: 'jordan.ellis@synthetic.example',
	start: telehealthAppointmentRdo.start,
	end: telehealthAppointmentRdo.end,
	type: 'telehealth',
	state: 'waiting',
	waitingStartedAt: '2026-10-16T15:45:00.000Z',
	synthetic: true,
};

function jsonResponse(body: unknown, status = 200) {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	};
}

describe('telehealthRealAPI', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('lists joinable telehealth visits from the appointment API', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(jsonResponse({appointments: [telehealthAppointmentRdo, officeRdo], hasMore: false})),
		);

		const visits = await telehealthRealAPI.listJoinableVisits();

		expect(visits).toEqual([
			expect.objectContaining({
				id: `session-${appointmentId}`,
				appointmentId,
				type: 'telehealth',
				state: 'waiting',
			}),
		]);
		expect(fetch).toHaveBeenCalledWith('http://localhost:3001/appointments', expect.any(Object));
		expect(fetch).not.toHaveBeenCalledWith(
			expect.stringContaining('/telehealth/sessions'),
			expect.anything(),
		);
	});

	it('creates, gets, joins, and ends Nest sessions without a leave route', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			const method = init?.method ?? 'GET';
			if (url === 'http://localhost:3001/telehealth/sessions' && method === 'POST') {
				return jsonResponse(sessionRdo, 201);
			}
			if (url === `http://localhost:3001/telehealth/sessions/${sessionId}` && method === 'GET') {
				return jsonResponse(sessionRdo);
			}
			if (url === `http://localhost:3001/telehealth/sessions/${sessionId}/join` && method === 'POST') {
				return jsonResponse({...sessionRdo, state: 'in_session', joinedAt: '2026-10-16T16:02:00.000Z'});
			}
			if (url === `http://localhost:3001/telehealth/sessions/${sessionId}/end` && method === 'POST') {
				return jsonResponse({...sessionRdo, state: 'ended', endedAt: '2026-10-16T16:20:00.000Z'});
			}
			return jsonResponse({}, 404);
		});
		vi.stubGlobal('fetch', fetchMock);

		const created = await telehealthRealAPI.createSession(appointmentId);
		expect(created).toEqual(
			expect.objectContaining({
				id: sessionId,
				appointmentId,
				providerName: 'Dr. Jordan Ellis',
				state: 'waiting',
			}),
		);
		expect(created).not.toHaveProperty('practiceId');

		await expect(telehealthRealAPI.getSession(sessionId)).resolves.toMatchObject({id: sessionId});
		await expect(telehealthRealAPI.joinSession(sessionId)).resolves.toMatchObject({state: 'in_session'});
		await expect(telehealthRealAPI.leaveSession(sessionId)).resolves.toMatchObject({state: 'ended'});

		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:3001/telehealth/sessions',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({appointmentId}),
			}),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:3001/telehealth/sessions/${sessionId}`,
			expect.any(Object),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:3001/telehealth/sessions/${sessionId}/join`,
			expect.objectContaining({method: 'POST'}),
		);
		expect(fetchMock).toHaveBeenCalledWith(
			`http://localhost:3001/telehealth/sessions/${sessionId}/end`,
			expect.objectContaining({method: 'POST'}),
		);
		expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('/leave');
	});
});
