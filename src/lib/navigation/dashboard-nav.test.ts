import {
	DASHBOARD_NAV,
	filterNavForRole,
	isNavItemActive,
	resolveNavRole,
} from '@/lib/navigation/dashboard-nav';
import type {Role} from '@/types/auth/roles';

function hrefsFor(role: Role | undefined) {
	return filterNavForRole(role).map((item) => item.href);
}

describe('filterNavForRole', () => {
	it('returns only the dashboard home item when role is missing', () => {
		expect(hrefsFor(undefined)).toEqual(['/dashboard']);
	});

	it('shows the full staff admin menu for PRACTICE_ADMIN', () => {
		expect(hrefsFor('PRACTICE_ADMIN')).toEqual(DASHBOARD_NAV.map((item) => item.href));
	});

	it('hides settings and billing-only items appropriately for NURSE', () => {
		expect(hrefsFor('NURSE')).toEqual([
			'/dashboard',
			'/dashboard/patients',
			'/dashboard/appointments',
			'/dashboard/telehealth',
		]);
	});

	it('hides telehealth for RECEPTIONIST', () => {
		expect(hrefsFor('RECEPTIONIST')).toEqual([
			'/dashboard',
			'/dashboard/patients',
			'/dashboard/appointments',
			'/dashboard/billing',
		]);
	});

	it('shows a reduced self-service menu for PATIENT', () => {
		expect(hrefsFor('PATIENT')).toEqual([
			'/dashboard',
			'/dashboard/appointments',
			'/dashboard/telehealth',
			'/dashboard/billing',
		]);
	});
});

describe('resolveNavRole', () => {
	it('parses documented roles', () => {
		expect(resolveNavRole('PROVIDER')).toBe('PROVIDER');
	});

	it('defaults to PRACTICE_ADMIN in mock mode when the role is unknown', () => {
		expect(resolveNavRole('admin', {mockMode: true})).toBe('PRACTICE_ADMIN');
	});

	it('does not invent a role outside mock mode', () => {
		expect(resolveNavRole('admin', {mockMode: false})).toBeUndefined();
	});
});

describe('isNavItemActive', () => {
	it('does not mark Dashboard current on nested routes', () => {
		expect(isNavItemActive('/dashboard/patients', '/dashboard')).toBe(false);
	});

	it('marks nested paths under a section as current', () => {
		expect(isNavItemActive('/dashboard/patients/abc', '/dashboard/patients')).toBe(true);
	});
});
