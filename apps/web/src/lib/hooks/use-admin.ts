import {keepPreviousData, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {adminAPI} from '@/lib/api/admin-api';
import type {EventListParams, PagedResult, UserListParams} from '@/types/admin/admin-list';
import type {PracticeUser} from '@/types/admin/practice-user';
import type {Role} from '@/types/auth/roles';

export const adminUsersQueryKey = ['admin', 'users'] as const;
export const adminAuditEventsQueryKey = ['admin', 'audit-events'] as const;
export const adminSecurityEventsQueryKey = ['admin', 'security-events'] as const;

const listQueryOptions = {
	staleTime: 5 * 60 * 1000,
	gcTime: 10 * 60 * 1000,
	placeholderData: keepPreviousData,
};

export function useAdminUsers(params: UserListParams = {page: 1}, enabled = true) {
	return useQuery({
		queryKey: [...adminUsersQueryKey, params],
		queryFn: () => adminAPI.listUsers(params),
		enabled,
		...listQueryOptions,
	});
}

export function useAuditEvents(params: EventListParams = {page: 1}, enabled = true) {
	return useQuery({
		queryKey: [...adminAuditEventsQueryKey, params],
		queryFn: () => adminAPI.listAuditEvents(params),
		enabled,
		...listQueryOptions,
	});
}

export function useSecurityEvents(params: EventListParams = {page: 1}, enabled = true) {
	return useQuery({
		queryKey: [...adminSecurityEventsQueryKey, params],
		queryFn: () => adminAPI.listSecurityEvents(params),
		enabled,
		...listQueryOptions,
	});
}

export function useAssignUserRole() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({userId, role}: {userId: string; role: Role}) =>
			adminAPI.assignRole(userId, role),
		onSuccess: (updated) => {
			queryClient.setQueriesData<PagedResult<PracticeUser>>(
				{queryKey: adminUsersQueryKey},
				(current) => {
					if (!current) {
						return current;
					}
					return {
						...current,
						items: current.items.map((user) => (user.id === updated.id ? updated : user)),
					};
				},
			);
			void queryClient.invalidateQueries({queryKey: adminAuditEventsQueryKey});
		},
	});
}
