import {afterEach, describe, expect, it, vi} from 'vitest';
import type {AppointmentRdo} from '@/lib/api/appointment-rdo';
import {LIVE_DEMO_PROVIDER_ID} from '@/lib/api/live-demo-provider';
import {TELEHEALTH_API_UNAVAILABLE_MESSAGE, telehealthRealAPI} from '@/lib/api/telehealth-api';

const telehealthRdo: AppointmentRdo = {
	id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
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
	...telehealthRdo,
	id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
	type: 'office_visit',
	state: 'scheduled',
};

describe('telehealthRealAPI', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('lists joinable telehealth visits from the appointment API', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({appointments: [telehealthRdo, officeRdo], hasMore: false}),
			}),
		);

		const visits = await telehealthRealAPI.listJoinableVisits();

		expect(visits).toEqual([
			expect.objectContaining({
				id: 'session-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
				appointmentId: telehealthRdo.id,
				type: 'telehealth',
				state: 'waiting',
			}),
		]);
		expect(fetch).toHaveBeenCalledWith('http://localhost:3001/appointments', expect.any(Object));
	});

	it('rejects get, join, and leave without calling Nest telehealth routes', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await expect(telehealthRealAPI.getSession('session-demo')).rejects.toMatchObject({
			status: 404,
			code: 'TELEHEALTH_UNAVAILABLE',
			message: TELEHEALTH_API_UNAVAILABLE_MESSAGE,
		});
		await expect(telehealthRealAPI.joinSession('session-demo')).rejects.toMatchObject({
			code: 'TELEHEALTH_UNAVAILABLE',
		});
		await expect(telehealthRealAPI.leaveSession('session-demo')).rejects.toMatchObject({
			code: 'TELEHEALTH_UNAVAILABLE',
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
