export const PRACTICE_ROLES = [
	'SUPER_ADMIN',
	'PRACTICE_ADMIN',
	'PROVIDER',
	'NURSE',
	'RECEPTIONIST',
	'PATIENT',
] as const;

export type PracticeRole = (typeof PRACTICE_ROLES)[number];

export function isPracticeRole(value: string): value is PracticeRole {
	return (PRACTICE_ROLES as readonly string[]).includes(value);
}
