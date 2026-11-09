import {describe, expect, it} from 'vitest';
import type {DailyParticipant} from '@daily-co/daily-js';
import {
	buildStageTiles,
	findScreenShare,
	networkLevelFromState,
	resolveParticipantIdentity,
} from '@/lib/telehealth/call-participants';
import type {TelehealthParticipant} from '@/types/medical/telehealth-session';

const roster: TelehealthParticipant[] = [
	{userId: 'u-provider', displayName: 'Dr. Jordan Ellis', role: 'PROVIDER'},
	{userId: 'u-patient', displayName: 'Avery Quinn', role: 'PATIENT'},
	{userId: 'u-nurse', displayName: 'Riley Chen', role: 'NURSE'},
];

function daily(overrides: {
	local?: boolean;
	session_id: string;
	user_id: string;
	user_name?: string;
	audio?: 'playable' | 'off';
	video?: 'playable' | 'off';
	screen?: MediaStreamTrack;
	networkQualityState?: DailyParticipant['networkQualityState'];
}): DailyParticipant {
	return {
		session_id: overrides.session_id,
		user_id: overrides.user_id,
		user_name: overrides.user_name ?? 'Whatever the browser chose',
		local: overrides.local ?? false,
		networkQualityState: overrides.networkQualityState,
		tracks: {
			audio: {subscribed: true, state: overrides.audio ?? 'playable'},
			video: {subscribed: true, state: overrides.video ?? 'off'},
			screenAudio: {subscribed: true, state: 'off'},
			screenVideo: overrides.screen
				? {subscribed: true, state: 'playable', persistentTrack: overrides.screen}
				: {subscribed: true, state: 'off'},
		},
	} as unknown as DailyParticipant;
}

describe('resolveParticipantIdentity', () => {
	it('takes name and role from the roster by user_id', () => {
		expect(resolveParticipantIdentity('u-nurse', roster)).toEqual({name: 'Riley Chen', role: 'NURSE'});
	});

	it('shows "Participant" with no role tag for an unknown id', () => {
		expect(resolveParticipantIdentity('someone-else', roster)).toEqual({name: 'Participant', role: null});
		expect(resolveParticipantIdentity(undefined, roster)).toEqual({name: 'Participant', role: null});
	});
});

describe('buildStageTiles', () => {
	const people = [
		daily({session_id: 's-nurse', user_id: 'u-nurse'}),
		daily({session_id: 's-me', user_id: 'u-provider', local: true}),
		daily({session_id: 's-patient', user_id: 'u-patient', video: 'playable'}),
	];

	it('lists the local tile first and names every tile from the roster', () => {
		const tiles = buildStageTiles(people, roster, null, 'good');
		expect(tiles.map((tile) => tile.id)).toEqual(['s-me', 's-nurse', 's-patient']);
		expect(tiles.find((tile) => tile.id === 's-patient')).toMatchObject({name: 'Avery Quinn', role: 'PATIENT'});
		expect(tiles.find((tile) => tile.id === 's-nurse')).toMatchObject({name: 'Riley Chen', role: 'NURSE'});
	});

	it('ignores a renamed Daily user_name', () => {
		const renamed = [
			daily({session_id: 's-patient', user_id: 'u-patient', user_name: 'Dr. Totally Legit'}),
		];
		const [tile] = buildStageTiles(renamed, roster, null, 'good');
		expect(tile.name).toBe('Avery Quinn');
		expect(tile.role).toBe('PATIENT');
	});

	it('labels an unknown remote "Participant" and the local tile "You" when it is off the roster', () => {
		const tiles = buildStageTiles(
			[
				daily({session_id: 's-me', user_id: 'nobody-1', local: true}),
				daily({session_id: 's-x', user_id: 'nobody-2'}),
			],
			roster,
			null,
			'good',
		);
		expect(tiles[0]).toMatchObject({name: 'You', role: null});
		expect(tiles[1]).toMatchObject({name: 'Participant', role: null});
	});

	it('reports mic and camera state, the active speaker and network per tile', () => {
		const tiles = buildStageTiles(
			[
				daily({session_id: 's-me', user_id: 'u-provider', local: true, audio: 'off', video: 'playable'}),
				daily({session_id: 's-patient', user_id: 'u-patient', networkQualityState: 'bad'}),
			],
			roster,
			's-patient',
			'fair',
		);
		expect(tiles[0]).toMatchObject({audioOn: false, videoOn: true, network: 'fair', speaking: false});
		expect(tiles[1]).toMatchObject({audioOn: true, videoOn: false, network: 'poor', speaking: true});
	});
});

describe('findScreenShare', () => {
	it('returns the sharer named from the roster, never from user_name', () => {
		const track = {kind: 'video'} as MediaStreamTrack;
		const share = findScreenShare(
			[
				daily({session_id: 's-me', user_id: 'u-provider', local: true}),
				daily({session_id: 's-patient', user_id: 'u-patient', user_name: 'Fake', screen: track}),
			],
			roster,
		);
		expect(share).toMatchObject({ownerId: 's-patient', ownerName: 'Avery Quinn', isLocal: false});
		expect(share?.track).toBe(track);
	});

	it('is null when nobody shares', () => {
		expect(findScreenShare([daily({session_id: 's-me', user_id: 'u-provider', local: true})], roster)).toBeNull();
	});
});

describe('networkLevelFromState', () => {
	it('maps Daily states to Good, Fair, Poor', () => {
		expect(networkLevelFromState('good')).toBe('good');
		expect(networkLevelFromState('warning')).toBe('fair');
		expect(networkLevelFromState('bad')).toBe('poor');
		expect(networkLevelFromState('unknown')).toBe('unknown');
		expect(networkLevelFromState(undefined)).toBe('unknown');
	});
});
