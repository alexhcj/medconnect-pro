import {LIVE_DEMO_PROVIDER_ID, liveDemoProvider} from '@/lib/api/live-demo-provider';
import type {Appointment, AppointmentState, AppointmentType} from '@/types/medical/appointment';

/** Appointment returned by Nest `AppointmentRdo`. */
export interface AppointmentRdo {
	id: string;
	practiceId: string;
	patientId: string;
	providerId: string;
	start: string;
	end: string;
	type: AppointmentType;
	state: AppointmentState;
	notes?: string;
	patientName: string;
	providerName: string;
	synthetic: boolean;
}

export interface AppointmentSearchResultRdo {
	appointments: AppointmentRdo[];
	nextPage?: number;
	hasMore: boolean;
}

export function appointmentFromRdo(rdo: AppointmentRdo): Appointment {
	const appointment: Appointment = {
		id: rdo.id,
		practiceId: rdo.practiceId,
		patientId: rdo.patientId,
		providerId: rdo.providerId,
		start: rdo.start,
		end: rdo.end,
		type: rdo.type,
		state: rdo.state,
		patientName: rdo.patientName,
		providerName:
			rdo.providerId === LIVE_DEMO_PROVIDER_ID ? liveDemoProvider.displayName : rdo.providerName,
		synthetic: rdo.synthetic,
	};
	if (rdo.notes) {
		appointment.notes = rdo.notes;
	}
	return appointment;
}
