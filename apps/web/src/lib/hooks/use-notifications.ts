import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {notificationAPI} from '@/lib/api/notification-api';
import type {
	InboxNotification,
	NotificationPreference,
	NotificationPreferencePatch,
} from '@/types/notifications/inbox';

export const notificationInboxQueryKey = ['notifications', 'inbox'] as const;
export const notificationPreferencesQueryKey = ['notifications', 'preferences'] as const;

export function useNotificationInbox(enabled = true) {
	return useQuery({
		queryKey: notificationInboxQueryKey,
		queryFn: () => notificationAPI.listInbox(),
		enabled,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useNotificationPreferences(enabled = false) {
	return useQuery({
		queryKey: notificationPreferencesQueryKey,
		queryFn: () => notificationAPI.getPreferences(),
		enabled,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function useMarkNotificationRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => notificationAPI.markRead(id),
		onSuccess: (updated) => {
			queryClient.setQueryData<InboxNotification[]>(notificationInboxQueryKey, (current) => {
				if (!current) {
					return current;
				}
				return current.map((item) => (item.id === updated.id ? updated : item));
			});
		},
	});
}

export function useUpdateNotificationPreferences() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (patch: NotificationPreferencePatch) => notificationAPI.updatePreferences(patch),
		onMutate: async (patch) => {
			await queryClient.cancelQueries({queryKey: notificationPreferencesQueryKey});
			const previous = queryClient.getQueryData<NotificationPreference>(
				notificationPreferencesQueryKey,
			);
			if (previous) {
				queryClient.setQueryData<NotificationPreference>(notificationPreferencesQueryKey, {
					...previous,
					...patch,
				});
			}
			return {previous};
		},
		onError: (_error, _patch, context) => {
			if (context?.previous) {
				queryClient.setQueryData(notificationPreferencesQueryKey, context.previous);
			}
		},
		onSuccess: (saved) => {
			queryClient.setQueryData(notificationPreferencesQueryKey, saved);
		},
	});
}
