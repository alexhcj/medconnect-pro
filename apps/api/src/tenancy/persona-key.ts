/**
 * Closed list of demo persona keys (SEC-013 scope 9). Keep in lockstep with the
 * `practice_memberships_persona_key_check` constraint in migration 1760000000013.
 */
export const DEMO_PERSONA_KEYS = [
	'provider-jordan-ellis',
	'nurse-riley-park',
	'patient-avery-quinn',
] as const;

export type DemoPersonaKey = (typeof DEMO_PERSONA_KEYS)[number];
