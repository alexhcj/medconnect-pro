import {describe, expect, it} from 'vitest';
import {
	addMinutesLocal,
	combineLocal,
	dateErrorMessage,
	formatTimeValue,
	isRealDay,
	maskUsDate,
	parseTime,
	parseUsDate,
	splitLocal,
	timeOptions,
	todayDay,
} from '@/lib/format/date-input';

describe('maskUsDate', () => {
	it('inserts slashes as digits are typed', () => {
		expect(maskUsDate('0')).toBe('0');
		expect(maskUsDate('08')).toBe('08');
		expect(maskUsDate('081')).toBe('08/1');
		expect(maskUsDate('0810')).toBe('08/10');
		expect(maskUsDate('08101')).toBe('08/10/1');
		expect(maskUsDate('08101970')).toBe('08/10/1970');
	});

	it('drops non-digits, extra digits and pasted formats', () => {
		expect(maskUsDate('08/10/1970x')).toBe('08/10/1970');
		expect(maskUsDate('0810197099')).toBe('08/10/1970');
		expect(maskUsDate('08-10-1970')).toBe('08/10/1970');
		expect(maskUsDate('abc')).toBe('');
	});

	it('lets a trailing slash be deleted', () => {
		expect(maskUsDate('08/')).toBe('08');
	});
});

describe('parseUsDate', () => {
	it('turns MM/DD/YYYY into YYYY-MM-DD', () => {
		expect(parseUsDate('08/10/1970')).toEqual({value: '1970-08-10'});
		expect(parseUsDate(' 03/04/1991 ')).toEqual({value: '1991-03-04'});
	});

	it('reports empty and incomplete input', () => {
		expect(parseUsDate('')).toEqual({error: 'empty'});
		expect(parseUsDate('08/1')).toEqual({error: 'incomplete'});
		expect(parseUsDate('08/10/19')).toEqual({error: 'incomplete'});
	});

	it('rejects days that do not exist', () => {
		expect(parseUsDate('02/30/1970')).toEqual({error: 'invalid'});
		expect(parseUsDate('13/01/1970')).toEqual({error: 'invalid'});
		expect(parseUsDate('00/10/1970')).toEqual({error: 'invalid'});
		expect(parseUsDate('02/29/1971')).toEqual({error: 'invalid'});
		expect(parseUsDate('02/29/1972')).toEqual({value: '1972-02-29'});
		expect(parseUsDate('ab/cd/efgh')).toEqual({error: 'invalid'});
	});

	it('applies min and max', () => {
		expect(parseUsDate('01/01/2026', {min: '2026-02-01'})).toEqual({error: 'before-min'});
		expect(parseUsDate('03/01/2026', {max: '2026-02-01'})).toEqual({error: 'after-max'});
		expect(parseUsDate('02/01/2026', {min: '2026-02-01', max: '2026-02-01'})).toEqual({value: '2026-02-01'});
	});
});

describe('dateErrorMessage', () => {
	it('words every error as text and names the limit in US format', () => {
		expect(dateErrorMessage('invalid')).toBe('Enter a real date as MM/DD/YYYY');
		expect(dateErrorMessage('incomplete')).toBe('Enter a full date as MM/DD/YYYY');
		expect(dateErrorMessage('empty')).toBe('Enter a date as MM/DD/YYYY');
		expect(dateErrorMessage('before-min', {min: '2026-10-01'})).toBe('Date must be on or after 10/01/2026');
		expect(dateErrorMessage('after-max', {max: '2026-10-01'})).toBe('Date must be on or before 10/01/2026');
	});
});

describe('isRealDay', () => {
	it('checks the calendar', () => {
		expect(isRealDay('2026-08-10')).toBe(true);
		expect(isRealDay('2026-02-30')).toBe(false);
		expect(isRealDay('08/10/2026')).toBe(false);
	});
});

describe('time options and parsing', () => {
	it('lists 96 quarter-hour options in h:mm AM/PM', () => {
		const options = timeOptions(15);
		expect(options).toHaveLength(96);
		expect(options[0]).toEqual({value: '00:00', label: '12:00 AM'});
		expect(options[1]).toEqual({value: '00:15', label: '12:15 AM'});
		expect(options[48]).toEqual({value: '12:00', label: '12:00 PM'});
		expect(options[95]).toEqual({value: '23:45', label: '11:45 PM'});
	});

	it('formats HH:mm as h:mm AM/PM', () => {
		expect(formatTimeValue('19:30')).toBe('7:30 PM');
		expect(formatTimeValue('09:05')).toBe('9:05 AM');
		expect(formatTimeValue('00:00')).toBe('12:00 AM');
		expect(formatTimeValue('12:00')).toBe('12:00 PM');
	});

	it('parses typed times', () => {
		expect(parseTime('7:00 PM')).toBe('19:00');
		expect(parseTime('7:00pm')).toBe('19:00');
		expect(parseTime('7p')).toBe('19:00');
		expect(parseTime('730 p')).toBe('19:30');
		expect(parseTime('12am')).toBe('00:00');
		expect(parseTime('12 PM')).toBe('12:00');
		expect(parseTime('9:05 a.m.')).toBe('09:05');
		expect(parseTime('19:00')).toBe('19:00');
		expect(parseTime('7')).toBe('07:00');
	});

	it('rejects things that are not times', () => {
		expect(parseTime('')).toBeNull();
		expect(parseTime('25:00')).toBeNull();
		expect(parseTime('7:75')).toBeNull();
		expect(parseTime('13pm')).toBeNull();
		expect(parseTime('0pm')).toBeNull();
		expect(parseTime('noon')).toBeNull();
	});
});

describe('local date-time values', () => {
	it('splits and combines the YYYY-MM-DDTHH:mm string', () => {
		expect(splitLocal('2026-08-10T19:00')).toEqual({day: '2026-08-10', time: '19:00'});
		expect(splitLocal('')).toBeNull();
		expect(splitLocal('2026-08-10')).toBeNull();
		expect(combineLocal('2026-08-10', '19:00')).toBe('2026-08-10T19:00');
	});

	it('adds minutes across the end of a day and month', () => {
		expect(addMinutesLocal('2026-08-10T19:00', 30)).toBe('2026-08-10T19:30');
		expect(addMinutesLocal('2026-08-31T23:45', 30)).toBe('2026-09-01T00:15');
		expect(addMinutesLocal('', 30)).toBe('');
		expect(addMinutesLocal('2026-02-30T10:00', 30)).toBe('');
	});

	it('gives today as YYYY-MM-DD', () => {
		expect(todayDay(new Date(2026, 7, 10, 23, 59))).toBe('2026-08-10');
	});
});
