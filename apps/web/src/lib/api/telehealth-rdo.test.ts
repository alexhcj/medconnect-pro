import {describe, expect, it} from 'vitest';
import {LIVE_DEMO_PROVIDER_ID} from '@/lib/api/live-demo-provider';
import {sessionFromRdo, type TelehealthSessionRdo} from '@/lib/api/telehealth-rdo';

const practiceId = '22222222-2222-4222-8222-222222222222';
const sessionRdo: TelehealthSessionRdo = {
	id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
	appointmentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
	practiceId,
	patientId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
	providerId: LIVE_DEMO_PROVIDER_ID,
	patientName: 'Avery Quinn',
	providerName: 'jordan.ellis@synthetic.example',
	start: '2026-09-26T14:00:00.000Z',
	end: '2026-09-26T14:45:00.000Z',
	type: 'telehealth',
	state: 'waiting',
	waitingStartedAt: '2026-09-26T13:58:00.000Z',
	joinedAt: '2026-09-26T14:02:00.000Z',
	endedAt: '2026-09-26T14:40:00.000Z',
	synthetic: true,
};

describe('sessionFromRdo', () => {
	it('maps Nest session fields onto the UI type without practiceId', () => {
		expect(sessionFromRdo(sessionRdo)).toEqual({
			id: sessionRdo.id,
			appointmentId: sessionRdo.appointmentId,
			patientName: 'Avery Quinn',
			providerName: 'Dr. Jordan Ellis',
			start: sessionRdo.start,
			end: sessionRdo.end,
			type: 'telehealth',
			state: 'waiting',
			synthetic: true,
		});
		expect(sessionFromRdo(sessionRdo)).not.toHaveProperty('practiceId');
		expect(sessionFromRdo(sessionRdo)).not.toHaveProperty('patientId');
		expect(sessionFromRdo(sessionRdo)).not.toHaveProperty('providerId');
		expect(sessionFromRdo(sessionRdo)).not.toHaveProperty('waitingStartedAt');
		expect(sessionFromRdo(sessionRdo)).not.toHaveProperty('joinedAt');
		expect(sessionFromRdo(sessionRdo)).not.toHaveProperty('endedAt');
	});

	it('keeps the Nest provider name when the actor is not the live demo provider', () => {
		expect(
			sessionFromRdo({
				...sessionRdo,
				providerId: '33333333-3333-4333-8333-333333333333',
				providerName: 'Dr. Casey Walsh',
			}).providerName,
		).toBe('Dr. Casey Walsh');
	});
});
