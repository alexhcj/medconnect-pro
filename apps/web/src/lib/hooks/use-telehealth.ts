import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {telehealthAPI} from '@/lib/api/telehealth-api';

export function useJoinableTelehealthVisits(enabled = true) {
	return useQuery({
		queryKey: ['telehealth', 'visits'],
		queryFn: () => telehealthAPI.listJoinableVisits(),
		enabled,
		staleTime: 2 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	});
}

export function useTelehealthSession(sessionId: string, enabled = true) {
	return useQuery({
		queryKey: ['telehealth', 'session', sessionId],
		queryFn: () => telehealthAPI.getSession(sessionId),
		enabled: enabled && !!sessionId,
		staleTime: 0,
		gcTime: 5 * 60 * 1000,
	});
}

export function useJoinTelehealthSession() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (sessionId: string) => telehealthAPI.joinSession(sessionId),
		onSuccess: (session) => {
			queryClient.setQueryData(['telehealth', 'session', session.id], session);
			queryClient.invalidateQueries({queryKey: ['telehealth', 'visits']});
		},
	});
}

export function useLeaveTelehealthSession() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (sessionId: string) => telehealthAPI.leaveSession(sessionId),
		onSuccess: (session) => {
			queryClient.setQueryData(['telehealth', 'session', session.id], session);
			queryClient.invalidateQueries({queryKey: ['telehealth', 'visits']});
		},
	});
}
