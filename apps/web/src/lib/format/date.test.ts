import {describe, expect, it} from 'vitest';
import {
	formatDate,
	formatDateOnly,
	formatDateOnlyLong,
	formatDateTime,
	formatDateTimeRange,
	formatLongDate,
	formatTime,
	formatUtcDay,
	formatZone,
	formatZoneLong,
} from '@/lib/format/date';

const LA = 'America/Los_Angeles';

describe('date formatters (en-US)', () => {
	it('formats a date as MM/DD/YYYY', () => {
		expect(formatDate('2026-08-10T19:00:00.000Z', LA)).toBe('08/10/2026');
		expect(formatDate('2026-01-05T12:00:00.000Z', LA)).toBe('01/05/2026');
	});

	it('uses the time zone passed, so the same instant can fall on two days', () => {
		expect(formatDate('2026-08-11T02:00:00.000Z', LA)).toBe('08/10/2026');
		expect(formatDate('2026-08-11T02:00:00.000Z', 'UTC')).toBe('08/11/2026');
	});

	it('formats time as h:mm AM/PM with a plain space', () => {
		expect(formatTime('2026-08-11T02:00:00.000Z', LA)).toBe('7:00 PM');
		expect(formatTime('2026-08-10T16:05:00.000Z', LA)).toBe('9:05 AM');
		expect(formatTime('2026-08-10T07:00:00.000Z', LA)).toBe('12:00 AM');
		expect(formatTime('2026-08-10T19:00:00.000Z', LA)).not.toMatch(/[  ]/);
	});

	it('labels the zone, following daylight saving', () => {
		expect(formatZone('2026-08-10T19:00:00.000Z', LA)).toBe('PDT');
		expect(formatZone('2026-12-10T19:00:00.000Z', LA)).toBe('PST');
	});

	it('formats a date-time with the zone label', () => {
		expect(formatDateTime('2026-08-11T02:00:00.000Z', LA)).toBe('08/10/2026, 7:00 PM PDT');
	});

	it('formats a same-day range with one date and one zone label', () => {
		expect(formatDateTimeRange('2026-08-11T02:00:00.000Z', '2026-08-11T02:30:00.000Z', LA)).toBe(
			'08/10/2026, 7:00 PM – 7:30 PM PDT',
		);
	});

	it('formats a range across midnight with both full date-times', () => {
		expect(formatDateTimeRange('2026-08-11T06:30:00.000Z', '2026-08-11T07:30:00.000Z', LA)).toBe(
			'08/10/2026, 11:30 PM PDT – 08/11/2026, 12:30 AM PDT',
		);
	});

	it('formats a range across a daylight-saving change with both zones', () => {
		expect(formatDateTimeRange('2026-11-01T08:30:00.000Z', '2026-11-01T10:30:00.000Z', LA)).toBe(
			'11/01/2026, 1:30 AM PDT – 11/01/2026, 2:30 AM PST',
		);
	});

	it('formats the long form only when asked', () => {
		expect(formatLongDate('2026-08-10T19:00:00.000Z', LA)).toBe('Aug 10, 2026');
	});

	it('returns the input unchanged when it is not a date', () => {
		expect(formatDate('not a date')).toBe('not a date');
		expect(formatTime('')).toBe('');
		expect(formatDateTime('nope')).toBe('nope');
		expect(formatZone('nope')).toBe('');
		expect(formatDateTimeRange('a', 'b')).toBe('a – b');
	});

	it('does not depend on the browser language', () => {
		const original = Object.getOwnPropertyDescriptor(window.navigator, 'language');
		Object.defineProperty(window.navigator, 'language', {value: 'ru-RU', configurable: true});
		try {
			expect(formatDate('2026-08-10T19:00:00.000Z', LA)).toBe('08/10/2026');
			expect(formatTime('2026-08-10T19:00:00.000Z', LA)).toBe('12:00 PM');
		} finally {
			if (original) {
				Object.defineProperty(window.navigator, 'language', original);
			}
		}
	});
});

describe('date-only values', () => {
	it('formats a stored day without shifting it (UTC-shift case)', () => {
		expect(formatDateOnly('1970-01-01')).toBe('01/01/1970');
		// A naive `new Date('1970-01-01')` is UTC midnight, which is Dec 31 in US time zones.
		expect(formatDate('1970-01-01', LA)).toBe('12/31/1969');
		expect(formatDateOnly('1991-03-04')).toBe('03/04/1991');
	});

	it('returns the input when it is not YYYY-MM-DD', () => {
		expect(formatDateOnly('')).toBe('');
		expect(formatDateOnly('03/04/1991')).toBe('03/04/1991');
	});
});

describe('UTC calendar days (invoice dates)', () => {
	it('shows the stored day, not the previous day, for UTC midnight', () => {
		const iso = '2026-09-01T00:00:00.000Z';
		expect(formatUtcDay(iso)).toBe('09/01/2026');
		expect(formatDate(iso, LA)).toBe('08/31/2026');
	});
});

describe('long date-only values (accessible names)', () => {
	it('spells the month and keeps the stored day', () => {
		expect(formatDateOnlyLong('2026-08-10')).toBe('August 10, 2026');
		expect(formatDateOnlyLong('1970-01-01')).toBe('January 1, 1970');
		expect(formatDateOnlyLong('nope')).toBe('nope');
	});
});

describe('long zone names', () => {
	it('spells the zone out for hints', () => {
		expect(formatZoneLong('2026-08-10T19:00:00.000Z', LA)).toBe('Pacific Daylight Time');
		expect(formatZoneLong('2026-12-10T19:00:00.000Z', LA)).toBe('Pacific Standard Time');
		expect(formatZoneLong('nope')).toBe('');
	});
});
