import type {Role} from '@/types/auth/roles';

export type DashboardMetricIcon = 'users' | 'calendar' | 'revenue' | 'satisfaction';

export interface DashboardMetricTrend {
	value: number;
	direction: 'up' | 'down';
}

export interface DashboardMetric {
	id: string;
	title: string;
	value: string;
	icon: DashboardMetricIcon;
	trend?: DashboardMetricTrend;
	description?: string;
	roles: Role[];
}

export interface DashboardOverview {
	metrics: DashboardMetric[];
}
