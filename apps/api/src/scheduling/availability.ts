export type TimeInterval = {
	start: Date;
	end: Date;
};

export const DEMO_AVAILABILITY_TIME_ZONE = 'UTC';
export const DEMO_WORK_START_HOUR = 9;
export const DEMO_WORK_END_HOUR = 17;
export const DEMO_WEEKDAYS = [1, 2, 3, 4, 5] as const;
export const AVAILABILITY_MAX_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;

export const DEMO_WORKING_HOURS = DEMO_WEEKDAYS.map((weekday) => ({
	weekday,
	startLocal: '09:00',
	endLocal: '17:00',
	timeZone: DEMO_AVAILABILITY_TIME_ZONE,
}));

export function workingIntervals(from: Date, to: Date): TimeInterval[] {
	const intervals: TimeInterval[] = [];
	const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
	const last = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));

	for (let day = cursor; day <= last; day = new Date(day.getTime() + 24 * 60 * 60 * 1000)) {
		const weekday = day.getUTCDay();
		if (!DEMO_WEEKDAYS.includes(weekday as (typeof DEMO_WEEKDAYS)[number])) {
			continue;
		}
		const workStart = new Date(
			Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), DEMO_WORK_START_HOUR),
		);
		const workEnd = new Date(
			Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), DEMO_WORK_END_HOUR),
		);
		const start = workStart > from ? workStart : from;
		const end = workEnd < to ? workEnd : to;
		if (end > start) {
			intervals.push({start, end});
		}
	}
	return intervals;
}

export function subtractBusy(working: readonly TimeInterval[], busy: readonly TimeInterval[]): TimeInterval[] {
	let remaining = [...working];
	for (const block of busy) {
		remaining = remaining.flatMap((slot) => splitInterval(slot, block));
	}
	return remaining;
}

function splitInterval(free: TimeInterval, busy: TimeInterval): TimeInterval[] {
	if (busy.end <= free.start || busy.start >= free.end) {
		return [free];
	}
	const pieces: TimeInterval[] = [];
	if (busy.start > free.start) {
		pieces.push({start: free.start, end: busy.start < free.end ? busy.start : free.end});
	}
	if (busy.end < free.end) {
		pieces.push({start: busy.end > free.start ? busy.end : free.start, end: free.end});
	}
	return pieces.filter((piece) => piece.end > piece.start);
}
