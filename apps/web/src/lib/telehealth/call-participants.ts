import type {DailyParticipant} from '@daily-co/daily-js';
import type {Role} from '@/types/auth/roles';
import type {TelehealthParticipant} from '@/types/medical/telehealth-session';
import {mediaTileInitials} from '@/lib/telehealth/media-participant';

/**
 * Identity for call tiles (SEC-013 scopes 4 and 5). The name and role come from the Nest roster,
 * matched by the Daily `user_id` that Nest set in the meeting token. A client-chosen Daily
 * `user_name` is never read, so renaming it in the browser cannot change a tile.
 */
export const UNKNOWN_PARTICIPANT_NAME = 'Participant';

export type NetworkLevel = 'good' | 'fair' | 'poor' | 'unknown';

export interface StageTile {
	/** Daily `session_id`; stable for the life of one join. */
	id: string;
	userId: string | null;
	isLocal: boolean;
	/** Roster name, or "Participant" when the id is not on the roster. */
	name: string;
	/** Roster role, or null for an unknown id (no role tag). */
	role: Role | null;
	initials: string;
	audioOn: boolean;
	videoOn: boolean;
	videoTrack: MediaStreamTrack | null;
	network: NetworkLevel;
	speaking: boolean;
}

export interface ScreenShareView {
	/** Daily `session_id` of the sharer. */
	ownerId: string;
	ownerName: string;
	isLocal: boolean;
	track: MediaStreamTrack;
}

export function resolveParticipantIdentity(
	userId: string | null | undefined,
	roster: readonly TelehealthParticipant[],
): {name: string; role: Role | null} {
	const match = userId ? roster.find((entry) => entry.userId === userId) : undefined;
	return match ? {name: match.displayName, role: match.role} : {name: UNKNOWN_PARTICIPANT_NAME, role: null};
}

export function networkLevelFromState(state: string | undefined): NetworkLevel {
	if (state === 'good') {
		return 'good';
	}
	if (state === 'warning') {
		return 'fair';
	}
	if (state === 'bad') {
		return 'poor';
	}
	return 'unknown';
}

export const NETWORK_LEVEL_LABEL: Record<NetworkLevel, string> = {
	good: 'Good',
	fair: 'Fair',
	poor: 'Poor',
	unknown: 'Checking',
};

function trackOf(participant: DailyParticipant, kind: 'video' | 'screenVideo'): MediaStreamTrack | null {
	return participant.tracks?.[kind]?.persistentTrack ?? participant.tracks?.[kind]?.track ?? null;
}

function isOn(participant: DailyParticipant, kind: 'audio' | 'video'): boolean {
	const state = participant.tracks?.[kind]?.state;
	// `playable` or `loading` means the sender has the track on; `off`, `blocked` and `interrupted` do not.
	return state === 'playable' || state === 'loading' || (state === undefined && participant[kind] === true);
}

/** Local participant first, then remotes in join order. */
export function buildStageTiles(
	participants: readonly DailyParticipant[],
	roster: readonly TelehealthParticipant[],
	activeSpeakerId: string | null,
	localNetwork: NetworkLevel,
): StageTile[] {
	const ordered = [...participants].sort((a, b) => Number(b.local) - Number(a.local));
	return ordered.map((participant) => {
		const identity = resolveParticipantIdentity(participant.user_id, roster);
		const name = participant.local && identity.role === null ? 'You' : identity.name;
		return {
			id: participant.session_id,
			userId: participant.user_id ?? null,
			isLocal: participant.local,
			name,
			role: identity.role,
			initials: identity.role === null && !participant.local ? '?' : mediaTileInitials(name === 'You' ? 'You' : name),
			audioOn: isOn(participant, 'audio'),
			videoOn: isOn(participant, 'video'),
			videoTrack: trackOf(participant, 'video'),
			network: participant.local ? localNetwork : networkLevelFromState(participant.networkQualityState),
			speaking: activeSpeakerId === participant.session_id,
		};
	});
}

/** The first active screen share, local one first. */
export function findScreenShare(
	participants: readonly DailyParticipant[],
	roster: readonly TelehealthParticipant[],
): ScreenShareView | null {
	const ordered = [...participants].sort((a, b) => Number(b.local) - Number(a.local));
	for (const participant of ordered) {
		const track = trackOf(participant, 'screenVideo');
		if (track) {
			const identity = resolveParticipantIdentity(participant.user_id, roster);
			return {
				ownerId: participant.session_id,
				ownerName: participant.local ? 'You' : identity.name,
				isLocal: participant.local,
				track,
			};
		}
	}
	return null;
}
