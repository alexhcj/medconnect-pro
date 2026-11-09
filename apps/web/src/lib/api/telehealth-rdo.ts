import {LIVE_DEMO_PROVIDER_ID, liveDemoProvider} from '@/lib/api/live-demo-provider';
import type {AppointmentType} from '@/types/medical/appointment';
import type {
	TelehealthParticipant,
	TelehealthSession,
	TelehealthSessionState,
} from '@/types/medical/telehealth-session';

/** Session returned by Nest `TelehealthSessionRdo`. `practiceId` is informational only. */
export interface TelehealthSessionRdo {
	id: string;
	appointmentId: string;
	practiceId: string;
	patientId: string;
	providerId: string;
	patientName: string;
	providerName: string;
	start: string;
	end: string;
	type: AppointmentType;
	state: TelehealthSessionState;
	waitingStartedAt: string;
	joinedAt?: string;
	endedAt?: string;
	synthetic: boolean;
	participants?: TelehealthParticipant[];
	mediaExpiresAt?: string;
	viewerCanEnd?: boolean;
}

export function sessionFromRdo(rdo: TelehealthSessionRdo): TelehealthSession {
	return {
		id: rdo.id,
		appointmentId: rdo.appointmentId,
		patientName: rdo.patientName,
		providerName:
			rdo.providerId === LIVE_DEMO_PROVIDER_ID ? liveDemoProvider.displayName : rdo.providerName,
		start: rdo.start,
		end: rdo.end,
		type: rdo.type,
		state: rdo.state,
		// An older API without these fields must never show End visit (UX hint only; Nest enforces).
		participants: Array.isArray(rdo.participants) ? rdo.participants : [],
		viewerCanEnd: rdo.viewerCanEnd === true,
		...(rdo.mediaExpiresAt ? {mediaExpiresAt: rdo.mediaExpiresAt} : {}),
		...(rdo.joinedAt ? {joinedAt: rdo.joinedAt} : {}),
		...(rdo.endedAt ? {endedAt: rdo.endedAt} : {}),		synthetic: true,
	};
}
