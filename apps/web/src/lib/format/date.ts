/**
 * Date and time display for the web app (FE-057). Always `en-US`: nothing here follows the browser
 * or OS language. Times use the viewer's local time zone unless a `timeZone` is passed (tests).
 */

const LOCALE = 'en-US';
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

type Zone = string | undefined;

function parse(iso: string): Date | null {
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? null : date;
}

/** ICU 72+ puts a narrow no-break space before AM/PM; normalise it so output and tests agree. */
function plain(text: string): string {
	return text.replace(/[  ]/g, ' ');
}

function dateFormat(timeZone: Zone) {
	return new Intl.DateTimeFormat(LOCALE, {month: '2-digit', day: '2-digit', year: 'numeric', timeZone});
}

function timeFormat(timeZone: Zone) {
	return new Intl.DateTimeFormat(LOCALE, {hour: 'numeric', minute: '2-digit', hour12: true, timeZone});
}

/** `08/10/2026` for an instant, in the viewer's time zone. Returns the input when it is not a date. */
export function formatDate(iso: string, timeZone?: Zone): string {
	const date = parse(iso);
	return date ? dateFormat(timeZone).format(date) : iso;
}

/**
 * `08/10/2026` for a UTC-midnight instant (invoice issued / due dates), read as the calendar day
 * it was stored for, so US viewers never see the previous day.
 */
export function formatUtcDay(iso: string): string {
	return formatDate(iso, 'UTC');
}

/**
 * `08/10/2026` for a date-only value (`YYYY-MM-DD`, date of birth). Built from the parts with no
 * time-zone conversion, so it never shifts a day.
 */
export function formatDateOnly(day: string): string {
	const match = DAY.exec(day);
	if (!match) {
		return day;
	}
	const [, year, month, date] = match;
	return `${month}/${date}/${year}`;
}

/** `Aug 10, 2026`, only where a list already reads better long (calendar toolbar titles). */
export function formatLongDate(iso: string, timeZone?: Zone): string {
	const date = parse(iso);
	return date
		? new Intl.DateTimeFormat(LOCALE, {month: 'short', day: 'numeric', year: 'numeric', timeZone}).format(date)
		: iso;
}

/** `7:00 PM`. */
export function formatTime(iso: string, timeZone?: Zone): string {
	const date = parse(iso);
	return date ? plain(timeFormat(timeZone).format(date)) : iso;
}

/** Short zone label for the instant, for example `PDT`. Empty when the input is not a date. */
export function formatZone(iso: string, timeZone?: Zone): string {
	const date = parse(iso);
	if (!date) {
		return '';
	}
	const parts = new Intl.DateTimeFormat(LOCALE, {timeZoneName: 'short', timeZone}).formatToParts(date);
	return parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
}

/** `08/10/2026, 7:00 PM PDT`. */
export function formatDateTime(iso: string, timeZone?: Zone): string {
	if (!parse(iso)) {
		return iso;
	}
	return `${formatDate(iso, timeZone)}, ${formatTime(iso, timeZone)} ${formatZone(iso, timeZone)}`.trim();
}

/**
 * `08/10/2026, 7:00 PM – 7:30 PM PDT`; a range that crosses midnight (or a zone change) shows both
 * full date-times.
 */
export function formatDateTimeRange(startIso: string, endIso: string, timeZone?: Zone): string {
	if (!parse(startIso) || !parse(endIso)) {
		return `${startIso} – ${endIso}`;
	}
	const sameDay = formatDate(startIso, timeZone) === formatDate(endIso, timeZone);
	const sameZone = formatZone(startIso, timeZone) === formatZone(endIso, timeZone);
	if (sameDay && sameZone) {
		return `${formatDate(startIso, timeZone)}, ${formatTime(startIso, timeZone)} – ${formatTime(endIso, timeZone)} ${formatZone(endIso, timeZone)}`;
	}
	return `${formatDateTime(startIso, timeZone)} – ${formatDateTime(endIso, timeZone)}`;
}

/** `August 10, 2026` for a date-only value, for accessible names (never shifts a day). */
export function formatDateOnlyLong(day: string): string {
	const match = DAY.exec(day);
	if (!match) {
		return day;
	}
	const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
	return new Intl.DateTimeFormat(LOCALE, {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'}).format(date);
}

/** Long zone name for the instant, for example `Pacific Daylight Time`. Empty when the input is not a date. */
export function formatZoneLong(iso: string, timeZone?: Zone): string {
	const date = parse(iso);
	if (!date) {
		return '';
	}
	const parts = new Intl.DateTimeFormat(LOCALE, {timeZoneName: 'long', timeZone}).formatToParts(date);
	return parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
}
