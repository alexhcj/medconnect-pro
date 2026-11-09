/**
 * UX-only telehealth visibility. Matches dashboard Telehealth nav roles.
 * Server authorization remains authoritative (SEC-001).
 */
import {DASHBOARD_NAV} from '@/lib/navigation/dashboard-nav';
import type {Role} from '@/types/auth/roles';

const TELEHEALTH_NAV = DASHBOARD_NAV.find((item) => item.href === '/dashboard/telehealth');

export function canAccessTelehealth(role: Role | undefined): boolean {
	if (!role || !TELEHEALTH_NAV) {
		return false;
	}
	return TELEHEALTH_NAV.roles.includes(role);
}
