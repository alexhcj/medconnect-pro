/** `getUserMedia` / Daily failure kinds before they become a green room phase. */
export type MediaFailureKind = 'permission_denied' | 'no_device';

export function classifyGetUserMediaError(error: unknown): MediaFailureKind {
	const name = error && typeof error === 'object' && 'name' in error ? String((error as {name: unknown}).name) : '';
	if (name === 'NotFoundError' || name === 'OverconstrainedError') {
		return 'no_device';
	}
	return 'permission_denied';
}

/** Green room states (FE-062). Audio-only is a join choice, not a phase. */
export type PrejoinPhase = 'checking' | 'ready' | 'blocked' | 'no_camera';

/** Maps a `getUserMedia` or Daily camera-start failure to a green room phase. */
export function phaseFromMediaError(error: unknown): Extract<PrejoinPhase, 'blocked' | 'no_camera'> {
	return classifyGetUserMediaError(error) === 'no_device' ? 'no_camera' : 'blocked';
}

/**
 * Maps a Daily `camera-error` to a phase. A missing camera (not-found, or constraints that no device
 * satisfies) is "no camera"; everything else, including permission and in-use errors, is "blocked".
 */
export function phaseFromDailyCameraError(
	type: string | undefined,
	missingMedia: readonly string[] = [],
): Extract<PrejoinPhase, 'blocked' | 'no_camera'> {
	if (type === 'not-found' && (missingMedia.length === 0 || missingMedia.includes('video'))) {
		return 'no_camera';
	}
	if (type === 'constraints') {
		return 'no_camera';
	}
	return 'blocked';
}

export interface PrejoinJoinAction {
	label: 'Join visit' | 'Join with audio only';
	audioOnly: boolean;
	disabled: boolean;
}

/** The primary join button: video join when ready, audio-only when the camera cannot be used. */
export function primaryJoinAction(phase: PrejoinPhase): PrejoinJoinAction {
	if (phase === 'ready') {
		return {label: 'Join visit', audioOnly: false, disabled: false};
	}
	if (phase === 'checking') {
		return {label: 'Join visit', audioOnly: false, disabled: true};
	}
	return {label: 'Join with audio only', audioOnly: true, disabled: false};
}

/** Short readiness text next to the join button (also read out through a live region). */
export const PREJOIN_READINESS_COPY: Record<PrejoinPhase, string> = {
	checking: 'Checking…',
	ready: 'Ready to join',
	blocked: 'Camera blocked',
	no_camera: 'No camera',
};

