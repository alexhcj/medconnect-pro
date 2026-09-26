import type {AppointmentType} from '@/types/medical/appointment';

export const TELEHEALTH_SESSION_STATES = ['waiting', 'in_session', 'ended'] as const;

export type TelehealthSessionState = (typeof TELEHEALTH_SESSION_STATES)[number];

export interface TelehealthSession {
	id: string;
	appointmentId: string;
	patientName: string;
	providerName: string;
	start: string;
	end: string;
	type: AppointmentType;
	state: TelehealthSessionState;
	synthetic: true;
}
