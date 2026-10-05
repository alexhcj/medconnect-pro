import type {Role} from '@/types/auth/roles';
import type {DashboardMetric, DashboardOverview} from '@/types/dashboard/overview';

/** Live Nest metric icon. `satisfaction` exists only on mock fixtures. */
export type DashboardMetricIconRdo = 'users' | 'calendar' | 'revenue';

/** Metric returned by Nest `DashboardMetricRdo`. No `trend`. */
export interface DashboardMetricRdo {
	id: string;
	title: string;
	value: string;
	icon: DashboardMetricIconRdo;
	description?: string;
	roles: Role[];
}

/** Overview returned by Nest `DashboardOverviewRdo`. `synthetic` is always true. */
export interface DashboardOverviewRdo {
	synthetic: boolean;
	metrics: DashboardMetricRdo[];
}

export function metricFromRdo(rdo: DashboardMetricRdo): DashboardMetric {
	return {
		id: rdo.id,
		title: rdo.title,
		value: rdo.value,
		icon: rdo.icon,
		description: rdo.description,
		roles: rdo.roles,
	};
}

export function overviewFromRdo(rdo: DashboardOverviewRdo): DashboardOverview {
	return {
		metrics: rdo.metrics.map(metricFromRdo),
	};
}
