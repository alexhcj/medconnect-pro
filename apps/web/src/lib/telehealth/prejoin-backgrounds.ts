import type {DailyInputVideoProcessorSettings} from '@daily-co/daily-js';

/**
 * Background effects (SEC-013 scope 8): None, Blur and a fixed set of built-in images in every
 * environment. First-party static files only: no upload, no URL input. The choice stays in the
 * browser and is applied by Daily's in-browser processor on the local camera track.
 */
export const BACKGROUND_IMAGES = [
	{id: 'clinic-exam-room', label: 'Clinic exam room', src: '/telehealth/backgrounds/clinic-exam-room.jpg'},
	{id: 'nurse-station', label: 'Nurse station', src: '/telehealth/backgrounds/nurse-station.jpg'},
	{id: 'home-living-room', label: 'Home living room', src: '/telehealth/backgrounds/home-living-room.jpg'},
] as const;

export type BackgroundImageId = (typeof BACKGROUND_IMAGES)[number]['id'];

export type BackgroundChoice =
	| {kind: 'none'}
	| {kind: 'blur'}
	| {kind: 'image'; imageId: BackgroundImageId};

export const DEFAULT_BACKGROUND: BackgroundChoice = {kind: 'none'};

export function backgroundImageById(id: BackgroundImageId) {
	return BACKGROUND_IMAGES.find((image) => image.id === id) ?? BACKGROUND_IMAGES[0];
}

export function backgroundKey(choice: BackgroundChoice): string {
	return choice.kind === 'image' ? `image:${choice.imageId}` : choice.kind;
}

/** Daily video processor settings for a choice. `origin` makes the first-party image URL absolute. */
export function dailyProcessorFor(choice: BackgroundChoice, origin: string): DailyInputVideoProcessorSettings {
	if (choice.kind === 'blur') {
		return {type: 'background-blur', config: {strength: 0.6}};
	}
	if (choice.kind === 'image') {
		return {type: 'background-image', config: {source: new URL(backgroundImageById(choice.imageId).src, origin).href}};
	}
	return {type: 'none'};
}
