import type {DailyCallOptions} from '@daily-co/daily-js';
import {
	DEFAULT_BACKGROUND,
	dailyProcessorFor,
	type BackgroundChoice,
} from '@/lib/telehealth/prejoin-backgrounds';

/**
 * What the green room hands to the real join. It lives in the browser only: none of it is sent to
 * Nest or logged (SEC-013 scope 7). The preview call object is destroyed first, and these choices
 * become options on the call object that joins with the meeting token.
 */
export interface JoinChoices {
	audioOnly: boolean;
	cameraId?: string;
	microphoneId?: string;
	speakerId?: string;
	background: BackgroundChoice;
	/** Reserved for FE-065 (demo persona camera): a custom video source replaces the device camera. */
	videoSource?: MediaStreamTrack;
}

export const DEFAULT_JOIN_CHOICES: JoinChoices = {audioOnly: false, background: DEFAULT_BACKGROUND};

/** Call-object options for a join. Nothing here is a Daily room, token or participant name. */
export function dailyJoinOptions(
	choices: JoinChoices,
	origin: string,
): Pick<DailyCallOptions, 'startVideoOff' | 'videoSource' | 'audioSource' | 'inputSettings'> {
	const options: Pick<DailyCallOptions, 'startVideoOff' | 'videoSource' | 'audioSource' | 'inputSettings'> = {};
	if (choices.audioOnly) {
		options.startVideoOff = true;
		options.videoSource = false;
	} else if (choices.videoSource) {
		options.videoSource = choices.videoSource;
	} else if (choices.cameraId) {
		options.videoSource = choices.cameraId;
	}
	if (choices.microphoneId) {
		options.audioSource = choices.microphoneId;
	}
	if (!choices.audioOnly && choices.background.kind !== 'none') {
		options.inputSettings = {video: {processor: dailyProcessorFor(choices.background, origin)}};
	}
	return options;
}
