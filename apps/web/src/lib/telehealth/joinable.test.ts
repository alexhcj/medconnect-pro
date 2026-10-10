import {Appointment} from '@/types/medical/appointment';
import {
	appointmentIdFromSessionId,
	isJoinableTelehealthAppointment,
	isLiveJoinableTelehealthAppointment,
	isWithinTelehealthJoinWindow,
	sessionFromAppointment,
	telehealthSessionId,
	telehealthSessionPath,
} from '@/lib/telehealth/joinable';

const telehealth: Appointment = {
	id: 'demo-appointment-002',
	practiceId: 'demo-practice-001',
	patientId: 'demo-patient-004',
	providerId: 'demo-provider-004',
	start: '2026-10-16T16:00:00.000Z',
	end: '2026-10-16T16:30:00.000Z',
	type: 'telehealth',
	state: 'confirmed',
	patientName: 'Taylor Bennett',
	providerName: 'Dr. Casey Walsh',
	synthetic: true,
};

describe('isJoinableTelehealthAppointment', () => {
	it('allows scheduled and confirmed telehealth visits', () => {
		expect(isJoinableTelehealthAppointment(telehealth)).toBe(true);
		expect(isJoinableTelehealthAppointment({...telehealth, state: 'scheduled'})).toBe(true);
	});

	it('rejects office visits and closed telehealth visits', () => {
		expect(isJoinableTelehealthAppointment({...telehealth, type: 'office_visit'})).toBe(false);
		expect(isJoinableTelehealthAppointment({...telehealth, state: 'cancelled'})).toBe(false);
		expect(isJoinableTelehealthAppointment({...telehealth, state: 'completed'})).toBe(false);
	});
});

describe('telehealth join window', () => {
	const now = new Date('2026-10-16T16:00:00.000Z');

	it('allows joining 15 minutes before start through 15 minutes after end', () => {
		expect(isWithinTelehealthJoinWindow(telehealth.start, telehealth.end, now)).toBe(true);
		expect(
			isWithinTelehealthJoinWindow(
				telehealth.start,
				telehealth.end,
				new Date('2026-10-16T15:45:00.000Z'),
			),
		).toBe(true);
		expect(
			isWithinTelehealthJoinWindow(
				telehealth.start,
				telehealth.end,
				new Date('2026-10-16T16:45:00.000Z'),
			),
		).toBe(true);
		expect(
			isLiveJoinableTelehealthAppointment(telehealth, new Date('2026-10-16T16:00:00.000Z')),
		).toBe(true);
	});

	it('rejects appointments outside the window', () => {
		expect(
			isWithinTelehealthJoinWindow(
				telehealth.start,
				telehealth.end,
				new Date('2026-10-16T15:44:00.000Z'),
			),
		).toBe(false);
		expect(
			isLiveJoinableTelehealthAppointment(telehealth, new Date('2026-10-10T16:00:00.000Z')),
		).toBe(false);
	});
});

describe('telehealth session ids', () => {
	it('derives a stable session id from the appointment', () => {
		expect(telehealthSessionId(telehealth.id)).toBe('session-demo-appointment-002');
		expect(appointmentIdFromSessionId('session-demo-appointment-002')).toBe('demo-appointment-002');
		expect(appointmentIdFromSessionId('demo-appointment-002')).toBeUndefined();
		expect(telehealthSessionPath(telehealth.id)).toBe(
			'/dashboard/telehealth/session-demo-appointment-002',
		);
	});

	it('maps an appointment onto a waiting session', () => {
		expect(sessionFromAppointment(telehealth)).toMatchObject({
			id: 'session-demo-appointment-002',
			appointmentId: 'demo-appointment-002',
			patientName: 'Taylor Bennett',
			providerName: 'Dr. Casey Walsh',
			type: 'telehealth',
			state: 'waiting',
			synthetic: true,
		});
	});
});
