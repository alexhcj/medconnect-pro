/**
 * Pure state machine behind the `/login` API status indicator (FE-049). The indicator reports
 * whether the free-tier API (ADR-017) is awake; it never claims uptime.
 */

export type ApiStatusPhase = 'idle' | 'checking' | 'waking' | 'ready' | 'unreachable';

export interface ApiStatusState {
	phase: ApiStatusPhase;
	/** The card is open. Waking and unreachable open it; ready collapses it to a dot. */
	expanded: boolean;
	/** Epoch ms when the current wake cycle began. */
	wakingSince: number | null;
	elapsedSeconds: number;
	/** Increments whenever a new probe loop must start. */
	cycle: number;
	/** Increments when a submit is queued, to replay the attention cue. */
	pulse: number;
}

export type ApiStatusEvent =
	| {type: 'begin'}
	| {type: 'healthOk'}
	| {type: 'healthFailed'; now: number}
	| {type: 'tick'; now: number}
	| {type: 'retry'; now: number}
	| {type: 'submitWake'; now: number}
	| {type: 'queued'}
	| {type: 'toggle'}
	| {type: 'close'};

/** Seconds of waking before the indicator gives up and offers a manual retry. */
export const UNREACHABLE_AFTER_SECONDS = 90;

export const initialApiStatusState: ApiStatusState = {
	phase: 'idle',
	expanded: false,
	wakingSince: null,
	elapsedSeconds: 0,
	cycle: 0,
	pulse: 0,
};

function startWaking(state: ApiStatusState, now: number, newCycle: boolean): ApiStatusState {
	return {
		...state,
		phase: 'waking',
		expanded: true,
		wakingSince: now,
		elapsedSeconds: 0,
		cycle: newCycle ? state.cycle + 1 : state.cycle,
	};
}

export function apiStatusReducer(state: ApiStatusState, event: ApiStatusEvent): ApiStatusState {
	switch (event.type) {
		case 'begin':
			return state.phase === 'idle' ? {...state, phase: 'checking', cycle: state.cycle + 1} : state;
		case 'healthOk':
			if (state.phase !== 'checking' && state.phase !== 'waking') {
				return state;
			}
			return {...state, phase: 'ready', expanded: false, wakingSince: null, elapsedSeconds: 0};
		case 'healthFailed':
			// A failed probe only matters while checking. While waking the loop keeps going.
			return state.phase === 'checking' ? startWaking(state, event.now, false) : state;
		case 'tick': {
			if (state.phase !== 'waking' || state.wakingSince === null) {
				return state;
			}
			const elapsedSeconds = Math.max(0, Math.floor((event.now - state.wakingSince) / 1000));
			if (elapsedSeconds >= UNREACHABLE_AFTER_SECONDS) {
				return {...state, phase: 'unreachable', expanded: true, elapsedSeconds};
			}
			return elapsedSeconds === state.elapsedSeconds ? state : {...state, elapsedSeconds};
		}
		case 'retry':
			return state.phase === 'unreachable' ? startWaking(state, event.now, true) : state;
		case 'submitWake':
			// A failed submit means the API is asleep, whatever the indicator last believed.
			return state.phase === 'waking' ? state : startWaking(state, event.now, true);
		case 'queued':
			return {...state, pulse: state.pulse + 1};
		case 'toggle':
			return state.phase === 'idle' ? state : {...state, expanded: !state.expanded};
		case 'close':
			return state.expanded ? {...state, expanded: false} : state;
	}
}

export function isProbing(phase: ApiStatusPhase): boolean {
	return phase === 'checking' || phase === 'waking';
}

/** Text announced through the live region. It changes with the phase only, never with the timer. */
export function apiStatusAnnouncement(phase: ApiStatusPhase): string {
	switch (phase) {
		case 'checking':
			return 'Checking whether the API is awake.';
		case 'waking':
			return 'The API is waking up. This usually takes about a minute.';
		case 'ready':
			return 'The API is ready.';
		case 'unreachable':
			return 'The API did not respond. You can retry.';
		case 'idle':
			return '';
	}
}
