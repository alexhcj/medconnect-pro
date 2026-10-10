'use client';

import {QueryClient} from '@tanstack/react-query';

export {isMockMode} from '@/lib/api/mocks/runtime';

// Retrying auth failures or 429s cannot succeed and would spend more of the rate-limit budget.
const NON_RETRYABLE_STATUSES = new Set([401, 403, 429]);

export function isNonRetryable(error: unknown): boolean {
	const status = (error as {status?: unknown} | null)?.status;
	return typeof status === 'number' && NON_RETRYABLE_STATUSES.has(status);
}

// Create a client with healthcare-specific configuration
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Healthcare data should be refetched more frequently
			staleTime: 5 * 60 * 1000, // 5 minutes
			gcTime: 10 * 60 * 1000, // 10 minutes
			retry: (failureCount, error: unknown) => !isNonRetryable(error) && failureCount < 2,
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
			retry: (failureCount, error: unknown) => !isNonRetryable(error) && failureCount < 1,
			onError: (error: unknown) => {
				const err = error as { status?: number };
				if (err?.status === 401 || err?.status === 429) {
					return;
				}
				console.error('Mutation error:', err);
			},
		},
	},
});