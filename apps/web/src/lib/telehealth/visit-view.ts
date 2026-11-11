import type {TelehealthSession} from '@/types/medical/telehealth-session';

export type VisitView = 'closed' | 'green_room' | 'stage';

/**
 * FE-067: which screen an open visit shows. The Nest `state` says the visit is live, not that this
 * browser is in the call, so a later joiner gets the green room until they join from this page.
 * A reload starts again at the green room (the device choices live in memory only).
 * Authorization is never decided here; Nest enforces it on join and on the media token.
 */
export function visitView({
	state,
	joinedHere,
	closed,
}: {
	state: TelehealthSession['state'];
	joinedHere: boolean;
	closed: boolean;
}): VisitView {
	if (closed || state === 'ended') {
		return 'closed';
	}
	if (state === 'in_session' && joinedHere) {
		return 'stage';
	}
	return 'green_room';
}

/**
 * Status line for the green room when the visit is already live. Naming who is in the call needs
 * connected-participant presence from Nest, which does not exist yet (known limitation of FE-067).
 */
export const VISIT_ALREADY_STARTED_TEXT = 'This visit has already started';
