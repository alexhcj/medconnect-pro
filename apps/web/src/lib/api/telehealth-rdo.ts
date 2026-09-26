import {LIVE_DEMO_PROVIDER_ID, liveDemoProvider} from '@/lib/api/live-demo-provider';
import type {AppointmentType} from '@/types/medical/appointment';
import type {TelehealthSession, TelehealthSessionState} from '@/types/medical/telehealth-session';

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
		synthetic: true,
	};
}
