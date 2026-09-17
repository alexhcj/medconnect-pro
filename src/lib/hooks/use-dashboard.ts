import {useQuery} from '@tanstack/react-query';
import {dashboardAPI} from '@/lib/api/dashboard-api';

export function useDashboardOverview() {
	return useQuery({
		queryKey: ['dashboard', 'overview'],
		queryFn: () => dashboardAPI.getOverview(),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}
