import {describe, expect, it} from 'vitest';
import {appointmentFromRdo, type AppointmentRdo} from '@/lib/api/appointment-rdo';
import {LIVE_DEMO_PROVIDER_ID} from '@/lib/api/live-demo-provider';

const rdo: AppointmentRdo = {
	id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
	practiceId: '22222222-2222-4222-8222-222222222222',
	patientId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
	providerId: LIVE_DEMO_PROVIDER_ID,
	start: '2026-10-15T14:00:00.000Z',
	end: '2026-10-15T15:00:00.000Z',
	type: 'office_visit',
	state: 'scheduled',
	notes: 'Annual follow-up',
	patientName: 'Avery Quinn',
	providerName: 'jordan.ellis@synthetic.example',
	synthetic: true,
};

describe('appointmentFromRdo', () => {
	it('maps AppointmentRdo onto the UI appointment and uses the live provider display name', () => {
		expect(appointmentFromRdo(rdo)).toEqual({
			...rdo,
			providerName: 'Dr. Jordan Ellis',
		});
	});

	it('keeps Nest providerName when the id is not the live demo provider', () => {
		expect(
			appointmentFromRdo({
				...rdo,
				providerId: '33333333-3333-4333-8333-333333333333',
				providerName: 'Other Provider',
			}),
		).toMatchObject({providerName: 'Other Provider'});
	});
});
