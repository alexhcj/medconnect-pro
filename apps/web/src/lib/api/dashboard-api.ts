import type {DashboardOverview} from '@/types/dashboard/overview';
import {apiFetch} from '@/lib/api/http';
import {dashboardMockAPI} from '@/lib/api/mocks/dashboard-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';

const dashboardRealAPI = {
	getOverview: async (): Promise<DashboardOverview> => {
		return apiFetch<DashboardOverview>('/api/dashboard/overview');
	},
};

export const dashboardAPI = isMockMode() ? dashboardMockAPI : dashboardRealAPI;
