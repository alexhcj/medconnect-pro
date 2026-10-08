import type {Role} from '@/types/auth/roles';
import type {TelehealthSession} from '@/types/medical/telehealth-session';

export function mediaTileInitials(name: string): string {
	const parts = name
		.replace(/^Dr\.\s+/i, '')
		.split(/\s+/)
		.filter(Boolean);
	if (parts.length === 0) {
		return 'You';
	}
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function localParticipantDisplayName(
	session: TelehealthSession,
	role: Role | undefined,
): string {
	if (role === 'PATIENT') {
		return session.patientName;
	}
	if (role === 'PROVIDER') {
		return session.providerName;
	}
	return 'You';
}

export function remoteParticipantFallbackName(
	session: TelehealthSession,
	role: Role | undefined,
): string {
	if (role === 'PATIENT') {
		return session.providerName;
	}
	return session.patientName;
}
