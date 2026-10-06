import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {adminAPI} from '@/lib/api/admin-api';
import type {PracticeUser} from '@/types/admin/practice-user';
import type {Role} from '@/types/auth/roles';

export const adminUsersQueryKey = ['admin', 'users'] as const;
export const adminAuditEventsQueryKey = ['admin', 'audit-events'] as const;

export function useAdminUsers(enabled = true) {
	return useQuery({
		queryKey: adminUsersQueryKey,
		queryFn: () => adminAPI.listUsers(),
		enabled,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useAuditEvents(enabled = true) {
	return useQuery({
		queryKey: adminAuditEventsQueryKey,
		queryFn: () => adminAPI.listAuditEvents(),
		enabled,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useAssignUserRole() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({userId, role}: {userId: string; role: Role}) =>
			adminAPI.assignRole(userId, role),
		onSuccess: (updated) => {
			queryClient.setQueryData<PracticeUser[]>(adminUsersQueryKey, (current) => {
				if (!current) {
					return current;
				}
				return current.map((user) => (user.id === updated.id ? updated : user));
			});
			void queryClient.invalidateQueries({queryKey: adminAuditEventsQueryKey});
		},
	});
}
