import {
	appointmentTitle,
	appointmentEventLabel,
	calendarRangeLabel,
	initialCalendarDate,
	navigateCalendarDate,
	toCalendarEvents,
} from '@/lib/appointments/calendar-events';
import {Appointment} from '@/types/medical/appointment';

const scheduled: Appointment = {
	id: 'demo-appointment-001',
	practiceId: 'demo-practice-001',
	patientId: 'demo-patient-001',
	providerId: 'demo-provider-001',
	start: '2026-10-15T14:00:00.000Z',
	end: '2026-10-15T15:00:00.000Z',
	type: 'office_visit',
	state: 'scheduled',
	patientName: 'Avery Carter',
	providerName: 'Dr. Jordan Ellis',
	synthetic: true,
};

const cancelled: Appointment = {
	...scheduled,
	id: 'demo-appointment-003',
	start: '2026-10-14T14:00:00.000Z',
	end: '2026-10-14T15:00:00.000Z',
	type: 'follow_up',
	state: 'cancelled',
};

const confirmed: Appointment = {
	...scheduled,
	id: 'demo-appointment-002',
	patientId: 'demo-patient-004',
	providerId: 'demo-provider-004',
	start: '2026-10-16T16:00:00.000Z',
	end: '2026-10-16T16:30:00.000Z',
	type: 'telehealth',
	state: 'confirmed',
	patientName: 'Riley Nguyen',
	providerName: 'Dr. Sam Okonkwo',
};

describe('toCalendarEvents', () => {
	it('maps appointments to titled events and keeps cancelled visits', () => {
		const events = toCalendarEvents([cancelled, scheduled]);

		expect(events).toHaveLength(2);
		expect(events[0]).toMatchObject({
			id: 'demo-appointment-003',
			title: 'Avery Carter · Dr. Jordan Ellis',
			resource: cancelled,
		});
		expect(events[0].start.toISOString()).toBe('2026-10-14T14:00:00.000Z');
		expect(events[1].end.toISOString()).toBe('2026-10-15T15:00:00.000Z');
	});

	it('skips appointments with invalid instants', () => {
		expect(
			toCalendarEvents([
				{...scheduled, start: 'not-a-date'},
				{...scheduled, id: 'ok'},
				{...scheduled, id: 'bad-end', end: 'nope'},
			]),
		).toEqual([
			expect.objectContaining({
				id: 'ok',
				title: appointmentTitle(scheduled),
			}),
		]);
	});
});

describe('appointmentEventLabel', () => {
	it('appends the state label for accessible event titles', () => {
		expect(appointmentEventLabel(scheduled, 'Scheduled')).toBe(
			'Avery Carter · Dr. Jordan Ellis · Scheduled',
		);
	});
});

describe('initialCalendarDate', () => {
	const now = new Date('2026-09-24T12:00:00.000Z');

	it('uses the earliest non-cancelled start', () => {
		expect(initialCalendarDate([cancelled, confirmed, scheduled], now).toISOString()).toBe(
			'2026-10-15T14:00:00.000Z',
		);
	});

	it('falls back to the earliest start when every visit is cancelled', () => {
		expect(initialCalendarDate([cancelled], now).toISOString()).toBe('2026-10-14T14:00:00.000Z');
	});

	it('falls back to now when there are no valid events', () => {
		expect(initialCalendarDate([], now).toISOString()).toBe(now.toISOString());
		expect(initialCalendarDate([{...scheduled, start: 'bad'}], now).toISOString()).toBe(now.toISOString());
	});
});

describe('navigateCalendarDate', () => {
	const date = new Date('2026-10-15T14:00:00.000Z');
	const now = new Date('2026-09-24T12:00:00.000Z');

	it('moves by month, week, or day', () => {
		expect(navigateCalendarDate(date, 'month', 'NEXT').toISOString()).toBe('2026-11-15T14:00:00.000Z');
		expect(navigateCalendarDate(date, 'week', 'PREV').toISOString()).toBe('2026-10-08T14:00:00.000Z');
		expect(navigateCalendarDate(date, 'day', 'NEXT').toISOString()).toBe('2026-10-16T14:00:00.000Z');
	});

	it('returns the supplied now for Today', () => {
		expect(navigateCalendarDate(date, 'week', 'TODAY', now)).toBe(now);
	});
});

describe('calendarRangeLabel', () => {
	const date = new Date('2026-10-15T14:00:00.000Z');

	it('formats month, week, and day labels', () => {
		expect(calendarRangeLabel(date, 'month')).toMatch(/October 2026/);
		expect(calendarRangeLabel(date, 'day')).toMatch(/Oct 15, 2026/);
		expect(calendarRangeLabel(date, 'week')).toMatch(/2026/);
	});
});
