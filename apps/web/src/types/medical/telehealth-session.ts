import type {Role} from '@/types/auth/roles';
import type {DemoPersonaKey} from '@/lib/telehealth/demo-personas';
import type {AppointmentType} from '@/types/medical/appointment';

export const TELEHEALTH_SESSION_STATES = ['waiting', 'in_session', 'ended'] as const;

export type TelehealthSessionState = (typeof TELEHEALTH_SESSION_STATES)[number];

/** Server-sourced roster entry (BE-027). `userId` is the Daily meeting-token `user_id`. */
export interface TelehealthParticipant {
	userId: string;
	displayName: string;
	role: Role;
}

export interface TelehealthSession {
	id: string;
	appointmentId: string;
	patientName: string;
	providerName: string;
	start: string;
	end: string;
	type: AppointmentType;
	state: TelehealthSessionState;
	/** Invited roster (provider, patient, assigned nurses); not live presence. */
	participants: TelehealthParticipant[];
	/** UX hint from Nest's host rule. Enforcement stays on `POST .../end`. */
	viewerCanEnd: boolean;
	/** The caller's own demo persona key from Nest (FE-065). Absent from an older API and in mock sessions. */
	viewerPersonaKey?: DemoPersonaKey | null;
	/** When the Daily room and token expire (FE-064 warns before this). */
	mediaExpiresAt?: string;
	/** When the visit went live; the call timer counts from here. */
	joinedAt?: string;
	/** When the visit ended (Nest); the wrap-up duration is `endedAt` minus `joinedAt`. */
	endedAt?: string;
	synthetic: true;
}
