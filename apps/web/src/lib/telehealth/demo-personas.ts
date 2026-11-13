/**
 * Demo persona catalog (FE-065, SEC-013 scope 9). Three illustrated personas, one per demo account.
 * The key comes from Nest (`viewerPersonaKey`, the caller's own membership) and only selects the
 * picture. It never changes a display name. Keep the keys in lockstep with
 * `apps/api/src/tenancy/persona-key.ts`.
 */
export const DEMO_PERSONA_KEYS = ['provider-jordan-ellis', 'nurse-riley-park', 'patient-avery-quinn'] as const;

export type DemoPersonaKey = (typeof DEMO_PERSONA_KEYS)[number];

export interface DemoPersona {
	key: DemoPersonaKey;
	/** Short role label shown on the persona card. */
	roleLabel: string;
	/** Name shown on the persona card, from the demo catalog (never used for the call name). */
	cardName: string;
	/** First-party static illustration (760 x 428 frame, transparent background). */
	src: string;
	/** Mouth centre in the 760 wide art, where the mic-level cue is drawn. */
	mouth: {x: number; y: number};
}

export const PERSONA_ART_WIDTH = 760;
export const PERSONA_ART_HEIGHT = 428;

export const DEMO_PERSONAS: readonly DemoPersona[] = [
	{
		key: 'provider-jordan-ellis',
		roleLabel: 'Provider',
		cardName: 'Jordan Ellis',
		src: '/telehealth/personas/provider-jordan-ellis.svg',
		mouth: {x: 380, y: 184},
	},
	{
		key: 'nurse-riley-park',
		roleLabel: 'Nurse',
		cardName: 'Riley Park',
		src: '/telehealth/personas/nurse-riley-park.svg',
		mouth: {x: 380, y: 172},
	},
	{
		key: 'patient-avery-quinn',
		roleLabel: 'Patient',
		cardName: 'Avery Quinn',
		src: '/telehealth/personas/patient-avery-quinn.svg',
		mouth: {x: 380, y: 191},
	},
];

export const SYNTHETIC_CAMERA_LABEL = 'Demo · synthetic camera';

/** Narrow an API value. Anything outside the closed catalog means no persona option. */
export function parsePersonaKey(value: unknown): DemoPersonaKey | null {
	return typeof value === 'string' && (DEMO_PERSONA_KEYS as readonly string[]).includes(value)
		? (value as DemoPersonaKey)
		: null;
}

export function personaFor(key: DemoPersonaKey): DemoPersona {
	return DEMO_PERSONAS.find((persona) => persona.key === key) ?? DEMO_PERSONAS[0];
}
