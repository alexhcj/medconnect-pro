import {parseRole, type Role} from '@/types/auth/roles';
import type {DashboardMetric, DashboardOverview} from '@/types/dashboard/overview';
import {fixtureDashboardMetrics} from '@/lib/api/mocks/fixtures';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';
import {sessionMockFactories} from '@/lib/api/mocks/session-mock';

export function filterMetricsForRole(
	metrics: DashboardMetric[],
	role: Role | undefined,
): DashboardMetric[] {
	if (!role) {
		return [];
	}
	return metrics.filter((metric) => metric.roles.includes(role));
}

async function withMock<T>(work: () => T, errorMessage: string): Promise<T> {
	await mockDelay();
	if (shouldSimulateError()) {
		mockLog('warn', errorMessage);
		throw new Error(errorMessage);
	}
	return work();
}

export const dashboardMockAPI = {
	getOverview: async (): Promise<DashboardOverview> =>
		withMock(() => {
			const session = sessionMockFactories.createMockSession();
			const role = parseRole(session.userRole) ?? 'PRACTICE_ADMIN';
			return {
				metrics: filterMetricsForRole(fixtureDashboardMetrics, role),
			};
		}, 'Mock: Failed to load dashboard overview'),
};
