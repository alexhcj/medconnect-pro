/**
 * Parse and mask logic for the DateField / DateTimeField controls (FE-057). Typed text is
 * `MM/DD/YYYY` and `h:mm AM/PM`; stored values stay `YYYY-MM-DD` and the local `YYYY-MM-DDTHH:mm`
 * string the appointment schema already expects.
 */

export type DateParseError = 'empty' | 'incomplete' | 'invalid' | 'before-min' | 'after-max';

export type DateParseResult = {value: string; error?: undefined} | {value?: undefined; error: DateParseError};

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/;
const TIME = /^(\d{1,2})(?::?(\d{2}))?\s*([ap])?\.?m?\.?$/i;

function pad(value: number, length = 2): string {
	return String(value).padStart(length, '0');
}

/** Keeps digits only (max 8) and inserts the slashes: `08101970` becomes `08/10/1970`. */
export function maskUsDate(raw: string): string {
	const digits = raw.replace(/\D/g, '').slice(0, 8);
	if (digits.length <= 2) {
		return digits;
	}
	if (digits.length <= 4) {
		return `${digits.slice(0, 2)}/${digits.slice(2)}`;
	}
	return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** True when `YYYY-MM-DD` names a real calendar day (rejects 02/30). */
export function isRealDay(day: string): boolean {
	const match = DAY.exec(day);
	if (!match) {
		return false;
	}
	const [year, month, date] = [Number(match[1]), Number(match[2]), Number(match[3])];
	const probe = new Date(Date.UTC(year, month - 1, date));
	return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === date;
}

/** Turns typed `MM/DD/YYYY` into `YYYY-MM-DD`, or says why it cannot. `min` and `max` are `YYYY-MM-DD`. */
export function parseUsDate(text: string, limits: {min?: string; max?: string} = {}): DateParseResult {
	const trimmed = text.trim();
	if (!trimmed) {
		return {error: 'empty'};
	}
	const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
	if (!match) {
		return {error: /^[\d/]*$/.test(trimmed) ? 'incomplete' : 'invalid'};
	}
	const day = `${match[3]}-${match[1]}-${match[2]}`;
	if (!isRealDay(day) || Number(match[3]) < 1000) {
		return {error: 'invalid'};
	}
	if (limits.min && day < limits.min) {
		return {error: 'before-min'};
	}
	if (limits.max && day > limits.max) {
		return {error: 'after-max'};
	}
	return {value: day};
}

/** Text error for a failed parse; `min` and `max` are shown in `MM/DD/YYYY`. */
export function dateErrorMessage(
	error: DateParseError,
	limits: {min?: string; max?: string} = {},
): string {
	const us = (day?: string) => (day && DAY.test(day) ? `${day.slice(5, 7)}/${day.slice(8, 10)}/${day.slice(0, 4)}` : '');
	switch (error) {
		case 'empty':
			return 'Enter a date as MM/DD/YYYY';
		case 'incomplete':
			return 'Enter a full date as MM/DD/YYYY';
		case 'invalid':
			return 'Enter a real date as MM/DD/YYYY';
		case 'before-min':
			return limits.min ? `Date must be on or after ${us(limits.min)}` : 'Date is too early';
		case 'after-max':
			return limits.max ? `Date must be on or before ${us(limits.max)}` : 'Date is too late';
	}
}

/** `19:30` becomes `7:30 PM`. */
export function formatTimeValue(time: string): string {
	const match = /^(\d{2}):(\d{2})$/.exec(time);
	if (!match) {
		return time;
	}
	const hours = Number(match[1]);
	const suffix = hours >= 12 ? 'PM' : 'AM';
	return `${hours % 12 || 12}:${match[2]} ${suffix}`;
}

export interface TimeOption {
	/** `HH:mm`, 24-hour. */
	value: string;
	/** `h:mm AM/PM`. */
	label: string;
}

/** Every `step`-minute time of day, from 12:00 AM. */
export function timeOptions(step = 15): TimeOption[] {
	const options: TimeOption[] = [];
	for (let minutes = 0; minutes < 24 * 60; minutes += step) {
		const value = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
		options.push({value, label: formatTimeValue(value)});
	}
	return options;
}

/**
 * Typed time to `HH:mm`. Accepts `7`, `7p`, `7:30 pm`, `730p`, `19:00`; a bare number is read on the
 * 24-hour clock. Returns null when it is not a time.
 */
export function parseTime(text: string): string | null {
	const match = TIME.exec(text.trim());
	if (!match) {
		return null;
	}
	let hours = Number(match[1]);
	const minutes = match[2] === undefined ? 0 : Number(match[2]);
	const meridiem = match[3]?.toLowerCase();
	if (minutes > 59) {
		return null;
	}
	if (meridiem) {
		if (hours < 1 || hours > 12) {
			return null;
		}
		hours = (hours % 12) + (meridiem === 'p' ? 12 : 0);
	} else if (hours > 23) {
		return null;
	}
	return `${pad(hours)}:${pad(minutes)}`;
}

/** `{day, time}` from a local `YYYY-MM-DDTHH:mm` value, or null when it is empty or malformed. */
export function splitLocal(value: string): {day: string; time: string} | null {
	const match = LOCAL.exec(value);
	return match ? {day: match[1], time: match[2]} : null;
}

export function combineLocal(day: string, time: string): string {
	return `${day}T${time}`;
}

/** Local `YYYY-MM-DDTHH:mm` plus minutes, in the viewer's time zone. Returns '' when the input is not valid. */
export function addMinutesLocal(value: string, minutes: number): string {
	const parts = splitLocal(value);
	if (!parts || !isRealDay(parts.day)) {
		return '';
	}
	const [year, month, day] = parts.day.split('-').map(Number);
	const [hours, mins] = parts.time.split(':').map(Number);
	const date = new Date(year, month - 1, day, hours, mins + minutes);
	return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Today as `YYYY-MM-DD` in the viewer's time zone. */
export function todayDay(now = new Date()): string {
	return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
