import type {LucideIcon} from 'lucide-react';
import {Calendar, CreditCard, LayoutDashboard, Settings, Users, Video} from 'lucide-react';
import {parseRole, type Role, ROLES} from '@/types/auth/roles';

/**
 * Nav visibility is a UX control only. Hiding an item must never be treated as
 * authorization; server-side checks remain authoritative (SEC-001).
 */
export interface DashboardNavItem {
	name: string;
	href: string;
	icon: LucideIcon;
	roles: readonly Role[];
}

const ALL_ROLES: readonly Role[] = ROLES;
const STAFF_ROLES: readonly Role[] = [
	'SUPER_ADMIN',
	'PRACTICE_ADMIN',
	'PROVIDER',
	'NURSE',
	'RECEPTIONIST',
];
const CLINICAL_ROLES: readonly Role[] = [
	'SUPER_ADMIN',
	'PRACTICE_ADMIN',
	'PROVIDER',
	'NURSE',
	'PATIENT',
];
const BILLING_ROLES: readonly Role[] = [
	'SUPER_ADMIN',
	'PRACTICE_ADMIN',
	'PROVIDER',
	'RECEPTIONIST',
	'PATIENT',
];
const ADMIN_ROLES: readonly Role[] = ['SUPER_ADMIN', 'PRACTICE_ADMIN'];

export const DASHBOARD_NAV: readonly DashboardNavItem[] = [
	{name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ALL_ROLES},
	{name: 'Patients', href: '/dashboard/patients', icon: Users, roles: STAFF_ROLES},
	{name: 'Appointments', href: '/dashboard/appointments', icon: Calendar, roles: ALL_ROLES},
	{name: 'Telehealth', href: '/dashboard/telehealth', icon: Video, roles: CLINICAL_ROLES},
	{name: 'Billing', href: '/dashboard/billing', icon: CreditCard, roles: BILLING_ROLES},
	{name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ADMIN_ROLES},
];

export function filterNavForRole(
	role: Role | undefined,
	items: readonly DashboardNavItem[] = DASHBOARD_NAV,
): DashboardNavItem[] {
	if (!role) {
		return items.filter((item) => item.href === '/dashboard');
	}
	return items.filter((item) => item.roles.includes(role));
}

export function resolveNavRole(
	userRole: string | undefined,
	options: {mockMode?: boolean} = {},
): Role | undefined {
	const parsed = parseRole(userRole);
	if (parsed) {
		return parsed;
	}
	if (options.mockMode && userRole) {
		return 'PRACTICE_ADMIN';
	}
	return undefined;
}

export function isNavItemActive(pathname: string, href: string): boolean {
	if (href === '/dashboard') {
		return pathname === '/dashboard';
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}
