export const APPOINTMENT_TYPES = ['office_visit', 'telehealth', 'follow_up'] as const;

export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const APPOINTMENT_STATES = ['scheduled', 'confirmed', 'cancelled', 'completed'] as const;

export type AppointmentState = (typeof APPOINTMENT_STATES)[number];

export const APPOINTMENT_CREATE_STATES = ['scheduled', 'confirmed'] as const;

export type AppointmentCreateState = (typeof APPOINTMENT_CREATE_STATES)[number];

export interface AppointmentCreateInput {
	patientId: string;
	providerId: string;
	start: string;
	end: string;
	type: AppointmentType;
	state: AppointmentCreateState;
	notes?: string;
}

export interface Appointment {
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
