import {describe, expect, it} from 'vitest';
import {followUpHref, findNextAppointment} from '@/lib/telehealth/next-appointment';
import type {Appointment} from '@/types/medical/appointment';

const NOW = Date.parse('2026-10-29T15:00:00.000Z');

function appointment(overrides: Partial<Appointment>): Appointment {
	return {
		id: 'a1',
		practiceId: 'p1',
		patientId: 'patient-1',
		providerId: 'provider-1',
		start: '2026-11-12T15:00:00.000Z',
		end: '2026-11-12T15:15:00.000Z',
		type: 'telehealth',
		state: 'scheduled',
		patientName: 'Avery Quinn',
		providerName: 'Dr. Jordan Ellis',
		synthetic: true,
		...overrides,
	};
}

describe('findNextAppointment', () => {
	it('returns the earliest future scheduled or confirmed appointment other than this visit', () => {
		const next = findNextAppointment(
			[
				appointment({id: 'current', start: '2026-10-29T14:00:00.000Z'}),
				appointment({id: 'later', start: '2026-12-01T15:00:00.000Z'}),
				appointment({id: 'soon', start: '2026-11-12T15:00:00.000Z', state: 'confirmed'}),
			],
			'current',
			NOW,
		);
		expect(next?.id).toBe('soon');
	});

	it('ignores cancelled, completed and past appointments, and the current visit', () => {
		expect(
			findNextAppointment(
				[
					appointment({id: 'c', state: 'cancelled'}),
					appointment({id: 'd', state: 'completed'}),
					appointment({id: 'past', start: '2026-10-01T15:00:00.000Z'}),
					appointment({id: 'current'}),
				],
				'current',
				NOW,
			),
		).toBeUndefined();
	});

	it('returns undefined without data', () => {
		expect(findNextAppointment(undefined, 'x', NOW)).toBeUndefined();
	});
});

describe('followUpHref', () => {
	it('carries the patient and provider ids', () => {
		expect(followUpHref('p 1', 'pr-2')).toBe('/dashboard/appointments/new?patientId=p+1&providerId=pr-2');
	});

	it('omits what is missing', () => {
		expect(followUpHref('p1')).toBe('/dashboard/appointments/new?patientId=p1');
		expect(followUpHref()).toBe('/dashboard/appointments/new');
	});
});
