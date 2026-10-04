import {describe, expect, it} from 'vitest';
import {
	currentMonthIssuedAt,
	futureAppointmentWindow,
	secondTodayAppointmentWindow,
	utcDateKey,
} from './seed-mock-identity-corpus.js';

describe('seed mock identity corpus windows', () => {
	it('places the second today slot after the telehealth window when that stays on the UTC date', () => {
		const now = new Date('2026-10-04T15:00:00.000Z');
		const telehealthStart = new Date('2026-10-04T14:58:00.000Z');
		const telehealthEnd = new Date('2026-10-04T15:45:00.000Z');
		const window = secondTodayAppointmentWindow(now, telehealthStart, telehealthEnd);
		expect(utcDateKey(window.startAt)).toBe('2026-10-04');
		expect(window.startAt.toISOString()).toBe('2026-10-04T15:45:00.000Z');
		expect(window.endAt.toISOString()).toBe('2026-10-04T16:45:00.000Z');
	});

	it('places the second today slot before telehealth when after would leave the UTC date', () => {
		const now = new Date('2026-10-04T23:50:00.000Z');
		const telehealthStart = new Date('2026-10-04T23:48:00.000Z');
		const telehealthEnd = new Date('2026-10-05T00:33:00.000Z');
		const window = secondTodayAppointmentWindow(now, telehealthStart, telehealthEnd);
		expect(utcDateKey(window.startAt)).toBe('2026-10-04');
		expect(window.startAt.toISOString()).toBe('2026-10-04T22:48:00.000Z');
		expect(window.endAt.toISOString()).toBe('2026-10-04T23:48:00.000Z');
	});

	it('pins future slots to 16:00 UTC on the shifted date', () => {
		const window = futureAppointmentWindow(new Date('2026-10-04T09:10:00.000Z'), 14);
		expect(window.startAt.toISOString()).toBe('2026-10-18T16:00:00.000Z');
		expect(window.endAt.toISOString()).toBe('2026-10-18T17:00:00.000Z');
	});

	it('issues current-month invoices on UTC month day offsets', () => {
		const issued = currentMonthIssuedAt(new Date('2026-10-04T18:00:00.000Z'), 2);
		expect(issued.toISOString()).toBe('2026-10-03T12:00:00.000Z');
	});
});
