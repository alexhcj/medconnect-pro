/**
 * UX-only billing dashboard visibility. Matches dashboard Billing nav roles.
 * Server authorization remains authoritative (SEC-001). Nurse visit-context
 * billing is out of FE-008.
 */
import {DASHBOARD_NAV} from '@/lib/navigation/dashboard-nav';
import type {Role} from '@/types/auth/roles';

const BILLING_NAV = DASHBOARD_NAV.find((item) => item.href === '/dashboard/billing');

export function canAccessBillingDashboard(role: Role | undefined): boolean {
	if (!role || !BILLING_NAV) {
		return false;
	}
	return BILLING_NAV.roles.includes(role);
}
