import {canWriteAppointments, resolveAppointmentReadScope} from '../scheduling/appointment-access.js';
import type {PracticeRole} from '../tenancy/practice-role.js';

export function canCreateOrEndTelehealthSession(role: PracticeRole): boolean {
	return canWriteAppointments(role);
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
