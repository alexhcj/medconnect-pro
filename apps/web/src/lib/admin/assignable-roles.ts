import {ROLES, type Role} from '@/types/auth/roles';

/** UX-only grant options. Nest remains the security control. */
export function roleSelectOptions(current: Role): Role[] {
	const grantable = ROLES.filter((role) => role !== 'SUPER_ADMIN');
	if (current === 'SUPER_ADMIN') {
		return [current, ...grantable];
	}
	return [...grantable];
}
