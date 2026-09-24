import {describe, expect, it} from 'vitest';
import {subtractBusy, workingIntervals} from './availability.js';

describe('workingIntervals', () => {
	it('returns weekday UTC working hours clipped to the window', () => {
		const from = new Date('2026-10-15T00:00:00.000Z');
		const to = new Date('2026-10-16T00:00:00.000Z');
		expect(workingIntervals(from, to)).toEqual([
			{start: new Date('2026-10-15T09:00:00.000Z'), end: new Date('2026-10-15T17:00:00.000Z')},
		]);
	});

	it('skips Saturday and Sunday', () => {
		const from = new Date('2026-10-17T00:00:00.000Z');
		const to = new Date('2026-10-19T00:00:00.000Z');
		expect(workingIntervals(from, to)).toEqual([]);
	});
});

describe('subtractBusy', () => {
	it('returns remaining free intervals after busy blocks', () => {
		const working = [
			{start: new Date('2026-10-15T09:00:00.000Z'), end: new Date('2026-10-15T17:00:00.000Z')},
		];
		const busy = [
			{start: new Date('2026-10-15T14:00:00.000Z'), end: new Date('2026-10-15T15:00:00.000Z')},
		];
		expect(subtractBusy(working, busy)).toEqual([
			{start: new Date('2026-10-15T09:00:00.000Z'), end: new Date('2026-10-15T14:00:00.000Z')},
			{start: new Date('2026-10-15T15:00:00.000Z'), end: new Date('2026-10-15T17:00:00.000Z')},
		]);
	});

	it('returns no free intervals when the window is fully booked', () => {
		const working = [
			{start: new Date('2026-10-15T09:00:00.000Z'), end: new Date('2026-10-15T17:00:00.000Z')},
		];
		const busy = [
			{start: new Date('2026-10-15T09:00:00.000Z'), end: new Date('2026-10-15T17:00:00.000Z')},
		];
		expect(subtractBusy(working, busy)).toEqual([]);
	});
});
