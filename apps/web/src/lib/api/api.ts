'use client';

import {QueryClient} from '@tanstack/react-query';

export {isMockMode} from '@/lib/api/mocks/runtime';

// Create a client with healthcare-specific configuration
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Healthcare data should be refetched more frequently
			staleTime: 5 * 60 * 1000, // 5 minutes
			gcTime: 10 * 60 * 1000, // 10 minutes
			retry: (failureCount, error: unknown) => {
				const err = error as { status?: number };

				// Don't retry on auth errors
				if (err?.status === 401 || err?.status === 403) {
					return false;
				}
				return failureCount < 2;
			},
			// TODO: decide where to handle auth redirect
			// onError: (error: unknown) => {
			// 	const err = error as { status?: number };
			//
			// 	// Global error handling for PHI access
			// 	if (err?.status === 401) {
			// 		window.location.href = '/login?reason=unauthorized';
			// 	}
			// },
		},
		mutations: {
			retry: 1,
			onError: (error: unknown) => {
				const err = error as { status?: number };

				console.error('Mutation error:', err);
			},
		},
	},
});