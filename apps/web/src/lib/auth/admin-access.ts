/**
 * UX-only administration visibility. Matches dashboard Administration nav roles.
 * Server authorization remains authoritative (SEC-001). Nav hiding is not
 * authorization.
 */
import {DASHBOARD_NAV} from '@/lib/navigation/dashboard-nav';
import type {Role} from '@/types/auth/roles';

const ADMIN_NAV = DASHBOARD_NAV.find((item) => item.href === '/dashboard/admin');

export function canAccessAdministration(role: Role | undefined): boolean {
	if (!role || !ADMIN_NAV) {
		return false;
	}
	return ADMIN_NAV.roles.includes(role);
}
