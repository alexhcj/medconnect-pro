import {afterEach, describe, expect, it} from 'vitest';
import {clearCallSummaries, readCallSummary, recordCallSummary, worseNetwork} from '@/lib/telehealth/call-summary';
import type {StageTile} from '@/lib/telehealth/call-participants';

function tile(overrides: Partial<StageTile>): StageTile {
	return {
		id: 't',
		userId: 'u',
		isLocal: false,
		name: 'Name',
		role: null,
		initials: 'N',
		audioOn: true,
		videoOn: false,
		videoTrack: null,
		network: 'good',
		speaking: false,
		...overrides,
	};
}

describe('call summary', () => {
	afterEach(() => clearCallSummaries());

	it('collects roles in a fixed order across updates and ignores unknown participants', () => {
		recordCallSummary('s1', [tile({isLocal: true, role: 'PROVIDER'}), tile({id: 'x', role: null})]);
		recordCallSummary('s1', [tile({isLocal: true, role: 'PROVIDER'}), tile({id: 'n', role: 'NURSE'})]);
		recordCallSummary('s1', [tile({isLocal: true, role: 'PROVIDER'}), tile({id: 'p', role: 'PATIENT'})]);

		expect(readCallSummary('s1')?.roles).toEqual(['PROVIDER', 'PATIENT', 'NURSE']);
	});

	it('keeps the worst connection quality of the local participant only', () => {
		recordCallSummary('s1', [tile({isLocal: true, network: 'fair'}), tile({id: 'r', network: 'poor'})]);
		recordCallSummary('s1', [tile({isLocal: true, network: 'good'})]);

		expect(readCallSummary('s1')?.worstNetwork).toBe('fair');
	});

	it('returns nothing for a visit this browser never recorded', () => {
		expect(readCallSummary('other')).toBeUndefined();
	});

	it('ranks poor above fair above good above unknown', () => {
		expect(worseNetwork('good', 'poor')).toBe('poor');
		expect(worseNetwork('poor', 'good')).toBe('poor');
		expect(worseNetwork('unknown', 'good')).toBe('good');
		expect(worseNetwork('fair', 'good')).toBe('fair');
	});
});
