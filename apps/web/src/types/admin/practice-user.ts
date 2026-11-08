import type {Role} from '@/types/auth/roles';

export interface PracticeUser {
	id: string;
	email: string;
	role: Role;
	/** Membership display name, patient name, or role label; never the email (DATA-007). */
	displayName?: string;
	/** For example "MD" or "RN". */
	credential?: string | null;
	/** Demo persona key; read-only in M22. */
	personaKey?: string | null;
	practiceId: string;
	synthetic: boolean;
}
