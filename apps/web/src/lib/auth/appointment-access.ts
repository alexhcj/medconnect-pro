/**
 * UX-only appointment write visibility. Server authorization remains authoritative.
 */
import type {Permission} from '@/types/auth/permissions';

export function canWriteAppointments(permissions: readonly Permission[] | undefined): boolean {
	return permissions?.includes('write:appointments') ?? false;
}
