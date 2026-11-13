import {MEDIA_CONNECTION_COPY} from '@/components/telehealth/media-connection-status';
import type {DailyMediaConnectionState} from '@/lib/hooks/use-daily-media-session';
import type {NetworkLevel} from '@/lib/telehealth/call-participants';
import {DAILY_MEDIA_FAILURE_COPY, type DailyMediaFailureKind} from '@/lib/telehealth/media-failure';
import type {Role} from '@/types/auth/roles';

export type CallStateActionId = 'retry' | 'retry-devices' | 'turn-off-camera' | 'wait' | 'end-visit';

export interface CallStateAction {
	id: CallStateActionId;
	label: string;
}

export interface CallState {
	kind: 'info' | 'error';
	text: string;
	detail?: string;
	actions: CallStateAction[];
	/** Which TH-08 state this is; used by tests and to pick what the waiting tile says. */
	state:
		| 'joining'
		| 'waiting'
		| 'reconnecting'
		| 'poor_network'
		| 'participant_left'
		| 'device_lost'
		| 'not_configured'
		| 'failed';
}

export interface CallStateInput {
	connectionState: DailyMediaConnectionState;
	failureKind: DailyMediaFailureKind;
	/** Another participant is in the call right now. */
	hasRemote: boolean;
	/** Someone else was in this call earlier in this join. */
	hadRemote: boolean;
	/** Name of the last remote participant seen; used for "left the call". */
	lastRemoteName?: string;
	deviceLost: boolean;
	networkLevel: NetworkLevel;
	cameraOn: boolean;
	/** The viewer chose Wait after a participant left. */
	leftAcknowledged: boolean;
	/** From `viewerCanEnd`. Never derived from the role here. */
	canEnd: boolean;
	viewerRole?: Role;
	patientName?: string;
	providerName?: string;
}

/** Who this viewer is waiting for: the patient waits for the provider, everyone else for the patient. */
export function waitingCopy(input: Pick<CallStateInput, 'viewerRole' | 'patientName' | 'providerName'>): string {
	if (!input.viewerRole) {
		return MEDIA_CONNECTION_COPY.waiting_for_participant;
	}
	const name = input.viewerRole === 'PATIENT' ? input.providerName : input.patientName;
	return name ? `Waiting for ${name} to join…` : MEDIA_CONNECTION_COPY.waiting_for_participant;
}

export const DEVICE_LOST_COPY =
	'Camera or microphone access was lost. Allow access in your browser, then retry.';
export const POOR_NETWORK_COPY = 'Your network is weak. Turn off your camera to improve audio.';
export const NOT_CONFIGURED_DETAIL =
	'This demo environment does not have live Daily media configured.';

/**
 * Maps the media connection and presence into the one status the stage shows, with the actions
 * that make sense for the viewer (TH-08). Returns undefined for a healthy call.
 * End visit is only ever offered when the server said `viewerCanEnd`.
 */
export function deriveCallState(input: CallStateInput): CallState | undefined {
	if (input.connectionState === 'not_configured') {
		return {
			kind: 'error',
			state: 'not_configured',
			text: MEDIA_CONNECTION_COPY.not_configured,
			detail: NOT_CONFIGURED_DETAIL,
			actions: [],
		};
	}
	if (input.connectionState === 'failed') {
		return {
			kind: 'error',
			state: 'failed',
			text: DAILY_MEDIA_FAILURE_COPY[input.failureKind === 'none' ? 'generic' : input.failureKind],
			actions: [{id: 'retry', label: 'Retry'}],
		};
	}
	if (input.deviceLost) {
		return {kind: 'error', state: 'device_lost', text: DEVICE_LOST_COPY, actions: [{id: 'retry-devices', label: 'Retry devices'}]};
	}
	if (input.connectionState === 'joining') {
		return {kind: 'info', state: 'joining', text: MEDIA_CONNECTION_COPY.joining, actions: []};
	}
	if (input.connectionState === 'reconnecting') {
		return {kind: 'info', state: 'reconnecting', text: MEDIA_CONNECTION_COPY.reconnecting, actions: []};
	}
	if (!input.hasRemote) {
		if (input.hadRemote && !input.leftAcknowledged) {
			const actions: CallStateAction[] = [{id: 'wait', label: 'Wait'}];
			if (input.canEnd) {
				actions.push({id: 'end-visit', label: 'End visit'});
			}
			return {
				kind: 'info',
				state: 'participant_left',
				text: `${input.lastRemoteName ?? 'The other participant'} left the call.`,
				detail: 'The visit is still open.',
				actions,
			};
		}
		return {kind: 'info', state: 'waiting', text: waitingCopy(input), actions: []};
	}
	if (input.networkLevel === 'poor' && input.cameraOn) {
		return {
			kind: 'info',
			state: 'poor_network',
			text: POOR_NETWORK_COPY,
			actions: [{id: 'turn-off-camera', label: 'Turn off camera'}],
		};
	}
	return undefined;
}
