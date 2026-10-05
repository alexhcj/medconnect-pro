import {overviewFromRdo, type DashboardOverviewRdo} from '@/lib/api/dashboard-rdo';
import {apiFetch} from '@/lib/api/http';
import {dashboardMockAPI} from '@/lib/api/mocks/dashboard-mock';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {nestApiBaseUrl} from '@/lib/api/nest-api';
import type {DashboardOverview} from '@/types/dashboard/overview';

function dashboardOverviewUrl(): string {
	return `${nestApiBaseUrl()}/dashboard/overview`;
}

export const dashboardRealAPI = {
	getOverview: async (): Promise<DashboardOverview> => {
		const rdo = await apiFetch<DashboardOverviewRdo>(dashboardOverviewUrl());
		return overviewFromRdo(rdo);
	},
};

export const dashboardAPI = isMockMode() ? dashboardMockAPI : dashboardRealAPI;
