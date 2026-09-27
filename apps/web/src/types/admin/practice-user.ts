import type {Role} from '@/types/auth/roles';

export interface PracticeUser {
	id: string;
	email: string;
	role: Role;
	practiceId: string;
	synthetic: boolean;
}
