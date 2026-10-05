import {PRACTICE_ROLES, type PracticeRole} from '../tenancy/practice-role.js';

export const LIVE_DASHBOARD_METRIC_IDS = [
	'total_patients',
	'todays_appointments',
	'monthly_revenue',
	'upcoming_visits',
	'open_balance',
] as const;

export type LiveDashboardMetricId = (typeof LIVE_DASHBOARD_METRIC_IDS)[number];

export const DASHBOARD_METRIC_ICONS = ['users', 'calendar', 'revenue'] as const;
export type DashboardMetricIcon = (typeof DASHBOARD_METRIC_ICONS)[number];

export type DashboardMetricDefinition = {
	id: LiveDashboardMetricId;
	title: string;
	icon: DashboardMetricIcon;
	description: string;
	roles: PracticeRole[];
};

const STAFF_ROLES: readonly PracticeRole[] = [
	'SUPER_ADMIN',
	'PRACTICE_ADMIN',
	'PROVIDER',
	'NURSE',
	'RECEPTIONIST',
];

const REVENUE_ROLES: readonly PracticeRole[] = ['SUPER_ADMIN', 'PRACTICE_ADMIN', 'RECEPTIONIST'];

export const LIVE_DASHBOARD_METRICS: readonly DashboardMetricDefinition[] = [
	{
		id: 'total_patients',
		title: 'Total Patients',
		icon: 'users',
		description: 'Active patients in system',
		roles: [...STAFF_ROLES],
	},
	{
		id: 'todays_appointments',
		title: "Today's Appointments",
		icon: 'calendar',
		description: 'Scheduled for today',
		roles: [...STAFF_ROLES],
	},
	{
		id: 'monthly_revenue',
		title: 'Monthly Revenue',
		icon: 'revenue',
		description: "This month's earnings",
		roles: [...REVENUE_ROLES],
	},
	{
		id: 'upcoming_visits',
		title: 'Upcoming visits',
		icon: 'calendar',
		description: 'Your next scheduled visits',
		roles: ['PATIENT'],
	},
	{
		id: 'open_balance',
		title: 'Open balance',
		icon: 'revenue',
		description: 'Demo account balance',
		roles: ['PATIENT'],
	},
];

export function filterMetricsForRole(
	metrics: readonly DashboardMetricDefinition[],
	role: PracticeRole | undefined,
): DashboardMetricDefinition[] {
	if (!role || !PRACTICE_ROLES.includes(role)) {
		return [];
	}
	return metrics.filter((metric) => metric.roles.includes(role));
}

export function formatCount(value: number): string {
	return new Intl.NumberFormat('en-US').format(value);
}

export function formatCurrency(amountCents: number, currency = 'USD'): string {
	return new Intl.NumberFormat('en-US', {style: 'currency', currency}).format(amountCents / 100);
}
