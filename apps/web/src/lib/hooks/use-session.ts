import {useMutation, useQuery} from "@tanstack/react-query";
import {ActivityEvent, SessionInfo} from "@/types/auth/session";
import {toast} from "react-hot-toast";
import {useCallback, useEffect, useRef} from "react";
import {sessionAPI} from "@/lib/api/session-api";
import {queryClient} from "@/lib/api/api";
import {loginUrl} from "@/lib/auth/paths";
import {ApiError} from "@/lib/api/http";

export function useCurrentSession() {
	return useQuery({
		queryKey: ['session', 'current'],
		queryFn: sessionAPI.getCurrentSession,
		refetchInterval: 30000, // Check every 30 seconds
		retry: (failureCount, error) => {
			if (error instanceof ApiError && error.status === 401) {
				return false;
			}
			if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
				return false;
			}
			return failureCount < 2;
		},
	});
}

export function useLogin() {
	return useMutation({
		mutationFn: ({email, password}: {email: string; password: string}) =>
			sessionAPI.login(email, password),
		onSuccess: (session) => {
			queryClient.setQueryData(['session', 'current'], session);
		},
	});
}

export function useLogout() {
	return useMutation({
		mutationFn: sessionAPI.logout,
		onSettled: () => {
			queryClient.removeQueries({queryKey: ['session']});
			window.location.href = loginUrl('signed_out');
		},
	});
}

export function useExtendSession() {
	return useMutation({
		mutationFn: sessionAPI.extendSession,
		onSuccess: (data) => {
			// Update the session cache
			queryClient.setQueryData(['session', 'current'], (oldData: SessionInfo) => ({
				...oldData,
				expiresAt: data.newExpiresAt,
			}));

			// Update token if provided
			if (data.token) {
				localStorage.setItem('auth_token', data.token);
			}

			toast.success('Session extended successfully');
		},
		onError: (error) => {
			console.error('Session extension failed:', error);
			toast.error('Failed to extend session. Please save your work and log in again.');

			// Redirect to login after short delay
			setTimeout(() => {
				window.location.href = loginUrl('extension_failed');
			}, 3000);
		},
	});
}

export function useConcurrentSessions() {
	return useQuery({
		queryKey: ['session', 'concurrent'],
		queryFn: sessionAPI.checkConcurrentSessions,
		refetchInterval: 2 * 60 * 1000, // Check every 2 minutes
		retry: false, // Don't retry concurrent session checks
	});
}

export function useTerminateSessions() {
	return useMutation({
		mutationFn: sessionAPI.terminateSessions,
		onSuccess: () => {
			// Refresh concurrent sessions data
			queryClient.invalidateQueries({queryKey: ['session', 'concurrent']});
			toast.success('Sessions terminated successfully');
		},
		onError: (error) => {
			console.error('Failed to terminate sessions:', error);
			toast.error('Failed to terminate sessions');
		},
	});
}

export function useSendActivity() {
	return useMutation({
		mutationFn: sessionAPI.sendActivity,
		retry: 3,
		onError: (error) => {
			console.warn('Failed to send activity data:', error);
			// Don't show user-facing error for activity logging
		},
	});
}

export function useUpdateContext() {
	return useMutation({
		mutationFn: sessionAPI.updateContext,
		onSuccess: (_, context) => {
			// Update local session cache
			queryClient.setQueryData(['session', 'current'], (oldData: SessionInfo) => ({
				...oldData,
				currentContext: context,
			}));
		},
		onError: (error) => {
			console.error('Failed to update context:', error);
			// Context updates are not critical, so no user-facing error
		},
	});
}

// Custom hook for activity batching
export function useActivityBatcher() {
	const sendActivity = useSendActivity();
	const activityQueue = useRef<ActivityEvent[]>([]);
	const batchTimer = useRef<NodeJS.Timeout | null>(null);

	const addActivity = useCallback((activity: ActivityEvent) => {
		activityQueue.current.push(activity);

		// Batch activities and send every 10 seconds or when queue reaches 20 items
		if (activityQueue.current.length >= 20) {
			flushActivities();
		} else if (!batchTimer.current) {
			batchTimer.current = setTimeout(flushActivities, 10000);
		}
	}, []);

	const flushActivities = useCallback(() => {
		if (activityQueue.current.length === 0) return;

		const activities = [...activityQueue.current];
		activityQueue.current = [];

		if (batchTimer.current) {
			clearTimeout(batchTimer.current);
			batchTimer.current = null;
		}

		sendActivity.mutate(activities);
	}, [sendActivity]);

	// Flush on unmount
	useEffect(() => {
		return () => {
			flushActivities();
		};
	}, [flushActivities]);

	return {addActivity, flushActivities};
}

// Hook for session status with automatic management
export function useSessionStatus() {
	const {data: session, isLoading, error} = useCurrentSession();
	const extendSession = useExtendSession();
	const updateContext = useUpdateContext();

	const isActive = session?.isActive ?? false;
	const isExpiringSoon = session ? (session.expiresAt - Date.now()) < (10 * 60 * 1000) : false; // 10 minutes
	const isExpiringNow = session ? (session.expiresAt - Date.now()) < (2 * 60 * 1000) : false; // 2 minutes

	return {
		session,
		isLoading,
		error,
		isActive,
		isExpiringSoon,
		isExpiringNow,
		extendSession: extendSession.mutate,
		isExtending: extendSession.isPending,
		updateContext: updateContext.mutate,
		remainingTime: session ? Math.max(0, session.expiresAt - Date.now()) : 0,
	};
}