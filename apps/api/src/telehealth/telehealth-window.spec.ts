import {describe, expect, it} from 'vitest';
import {
	TELEHEALTH_GRACE_MS,
	canCreateTelehealthSession,
	isEligibleOpenTelehealthAppointment,
	isJoinableTelehealthAppointment,
	isPastGraceExpiry,
	isWithinJoinWindow,
} from './telehealth-window.js';

const start = new Date('2026-09-26T14:00:00.000Z');
const end = new Date('2026-09-26T15:00:00.000Z');

describe('telehealth window', () => {
	it('treats scheduled and confirmed telehealth appointments as joinable types', () => {
		expect(
			isJoinableTelehealthAppointment({type: 'telehealth', state: 'scheduled', endAt: end}),
		).toBe(true);
		expect(
			isJoinableTelehealthAppointment({type: 'telehealth', state: 'confirmed', endAt: end}),
		).toBe(true);
		expect(
			isJoinableTelehealthAppointment({type: 'office_visit', state: 'scheduled', endAt: end}),
		).toBe(false);
		expect(
			isJoinableTelehealthAppointment({type: 'telehealth', state: 'cancelled', endAt: end}),
		).toBe(false);
		expect(
			isJoinableTelehealthAppointment({type: 'telehealth', state: 'completed', endAt: end}),
		).toBe(false);
	});

	it('opens the join window 15 minutes before start through 15 minutes after end', () => {
		expect(isWithinJoinWindow(start, end, new Date(start.getTime() - TELEHEALTH_GRACE_MS))).toBe(true);
		expect(isWithinJoinWindow(start, end, new Date(start.getTime() - TELEHEALTH_GRACE_MS - 1))).toBe(
			false,
		);
		expect(isWithinJoinWindow(start, end, start)).toBe(true);
		expect(isWithinJoinWindow(start, end, end)).toBe(true);
		expect(isWithinJoinWindow(start, end, new Date(end.getTime() + TELEHEALTH_GRACE_MS))).toBe(true);
		expect(isWithinJoinWindow(start, end, new Date(end.getTime() + TELEHEALTH_GRACE_MS + 1))).toBe(
			false,
		);
	});

	it('expires grace after appointment end plus 15 minutes', () => {
		expect(isPastGraceExpiry(end, new Date(end.getTime() + TELEHEALTH_GRACE_MS))).toBe(false);
		expect(isPastGraceExpiry(end, new Date(end.getTime() + TELEHEALTH_GRACE_MS + 1))).toBe(true);
	});

	it('treats cancelled, completed, and past-grace visits as ineligible open sessions', () => {
		const now = start;
		expect(
			isEligibleOpenTelehealthAppointment(
				{type: 'telehealth', state: 'scheduled', endAt: end},
				now,
			),
		).toBe(true);
		expect(
			isEligibleOpenTelehealthAppointment(
				{type: 'telehealth', state: 'cancelled', endAt: end},
				now,
			),
		).toBe(false);
		expect(
			isEligibleOpenTelehealthAppointment(
				{type: 'telehealth', state: 'completed', endAt: end},
				now,
			),
		).toBe(false);
		expect(
			isEligibleOpenTelehealthAppointment(
				{type: 'telehealth', state: 'scheduled', endAt: end},
				new Date(end.getTime() + TELEHEALTH_GRACE_MS + 1),
			),
		).toBe(false);
	});

	it('allows create only for joinable visits that have not passed grace', () => {
		const appointment = {type: 'telehealth' as const, state: 'scheduled' as const, endAt: end};
		expect(canCreateTelehealthSession(appointment, new Date(end.getTime() + TELEHEALTH_GRACE_MS))).toBe(
			true,
		);
		expect(
			canCreateTelehealthSession(appointment, new Date(end.getTime() + TELEHEALTH_GRACE_MS + 1)),
		).toBe(false);
		expect(
			canCreateTelehealthSession({...appointment, type: 'follow_up'}, start),
		).toBe(false);
	});
});
