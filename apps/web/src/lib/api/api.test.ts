import {describe, expect, it} from 'vitest';
import {isNonRetryable, queryClient} from '@/lib/api/api';
import {ApiError, RateLimitedError} from '@/lib/api/http';

describe('queryClient retry policy', () => {
	const mutationRetry = queryClient.getDefaultOptions().mutations?.retry as (
		failureCount: number,
		error: unknown,
	) => boolean;

	it.each([401, 403, 429])('never retries status %i', (status) => {
		expect(isNonRetryable(new ApiError('x', status))).toBe(true);
		expect(mutationRetry(0, new ApiError('x', status))).toBe(false);
	});

	it('does not resend a rate-limited mutation', () => {
		expect(mutationRetry(0, new RateLimitedError(30))).toBe(false);
	});

	it('still retries a transient mutation failure once', () => {
		expect(mutationRetry(0, new ApiError('x', 503))).toBe(true);
		expect(mutationRetry(1, new ApiError('x', 503))).toBe(false);
	});
});
