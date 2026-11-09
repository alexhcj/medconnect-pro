import {canWriteAppointments, resolveAppointmentReadScope} from '../scheduling/appointment-access.js';
import type {PracticeRole} from '../tenancy/practice-role.js';

export function canCreateOrEndTelehealthSession(role: PracticeRole): boolean {
	return canWriteAppointments(role);
}

/**
 * Host rule for End visit (SEC-013): write:appointments plus the appointment's provider or a
 * practice admin. SUPER_ADMIN is scoped to the session practice (ADR-016). Resource-ownership
 * check, not a permission string.
 */
export function canEndTelehealthVisit(input: {
	role: PracticeRole;
	actorUserId: string;
	providerUserId: string;
}): boolean {
	if (!canWriteAppointments(input.role)) {
		return false;
	}
	return (
		input.role === 'PRACTICE_ADMIN' ||
		input.role === 'SUPER_ADMIN' ||
		input.actorUserId === input.providerUserId
	);
}

export function resolveTelehealthReadScope(role: PracticeRole) {
	return resolveAppointmentReadScope(role);
}

export function isVisitJoinParticipant(input: {
	actorUserId: string;
	providerUserId: string;
	portalUserId: string | null | undefined;
	isAssigned: boolean;
}): boolean {
	if (input.actorUserId === input.providerUserId) {
		return true;
	}
	if (input.portalUserId && input.actorUserId === input.portalUserId) {
		return true;
	}
	return input.isAssigned;
}
