import type {PracticeRole} from '../tenancy/practice-role.js';

const ROLE_LABELS: Record<PracticeRole, string> = {
	SUPER_ADMIN: 'Super admin',
	PRACTICE_ADMIN: 'Practice admin',
	PROVIDER: 'Provider',
	NURSE: 'Nurse',
	RECEPTIONIST: 'Receptionist',
	PATIENT: 'Patient',
};

export function roleLabel(role: PracticeRole): string {
	return ROLE_LABELS[role];
}

export type DisplayNameSource = {
	displayName?: string | null;
	role: PracticeRole;
};

export type PatientNameSource = {
	firstName: string;
	lastName: string;
};

/**
 * Single display rule for every RDO (DATA-007): the patient record's name for PATIENT, else the
 * membership `displayName`, else a role label. Never falls back to email.
 */
export function resolveDisplayName(
	source: DisplayNameSource,
	patient?: PatientNameSource | null,
): string {
	if (source.role === 'PATIENT' && patient) {
		const full = `${patient.firstName} ${patient.lastName}`.trim();
		if (full) {
			return full;
		}
	}
	const name = source.displayName?.trim();
	return name ? name : roleLabel(source.role);
}
