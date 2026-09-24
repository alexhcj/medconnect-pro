import {describe, expect, it} from 'vitest';
import {hasProviderOverlap} from './appointment-overlap.js';

const providerId = 'provider-1';
const otherProvider = 'provider-2';
const start = new Date('2026-10-15T14:00:00.000Z');
const end = new Date('2026-10-15T15:00:00.000Z');

describe('hasProviderOverlap', () => {
	it('detects an overlapping interval for the same provider', () => {
		expect(
			hasProviderOverlap(providerId, start, end, [
				{
					id: 'a',
					providerId,
					start: new Date('2026-10-15T14:30:00.000Z'),
					end: new Date('2026-10-15T15:30:00.000Z'),
					state: 'scheduled',
				},
			]),
		).toBe(true);
	});

	it('ignores cancelled appointments', () => {
		expect(
			hasProviderOverlap(providerId, start, end, [
				{
					id: 'cancelled',
					providerId,
					start,
					end,
					state: 'cancelled',
				},
			]),
		).toBe(false);
	});

	it('ignores another provider on the same slot', () => {
		expect(
			hasProviderOverlap(providerId, start, end, [
				{
					id: 'other',
					providerId: otherProvider,
					start,
					end,
					state: 'confirmed',
				},
			]),
		).toBe(false);
	});

	it('excludes the appointment being updated', () => {
		expect(
			hasProviderOverlap(
				providerId,
				start,
				end,
				[
					{
						id: 'self',
						providerId,
						start,
						end,
						state: 'scheduled',
					},
				],
				'self',
			),
		).toBe(false);
	});

	it('allows adjacent slots that share an endpoint', () => {
		expect(
			hasProviderOverlap(providerId, start, end, [
				{
					id: 'after',
					providerId,
					start: end,
					end: new Date('2026-10-15T16:00:00.000Z'),
					state: 'scheduled',
				},
			]),
		).toBe(false);
	});
});
