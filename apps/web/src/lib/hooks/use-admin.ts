import {useQuery} from '@tanstack/react-query';
import {adminAPI} from '@/lib/api/admin-api';

export function useAdminUsers(enabled = true) {
	return useQuery({
		queryKey: ['admin', 'users'],
		queryFn: () => adminAPI.listUsers(),
		enabled,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useAuditEvents(enabled = true) {
	return useQuery({
		queryKey: ['admin', 'audit-events'],
		queryFn: () => adminAPI.listAuditEvents(),
		enabled,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}
