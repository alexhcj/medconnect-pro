import {describe, expect, it} from 'vitest';
import {isNonRetryable, queryClient} from '@/lib/api/api';
import {ApiError, RateLimitedError} from '@/lib/api/http';

describe('queryClient retry policy', () => {
	const mutationRetry = queryClient.getDefaultOptions().mutations?.retry as (
		failureCount: number,
		error: unknown,
	) => boolean;

	it.each([401, 403, 409, 429])('never retries status %i', (status) => {
		expect(isNonRetryable(new ApiError('x', status))).toBe(true);
		expect(mutationRetry(0, new ApiError('x', status))).toBe(false);
	});

	it('does not retry an ended telehealth session conflict', () => {
		const ended = new ApiError('A telehealth session for this appointment has already ended.', 409, {
			code: 'SESSION_ENDED',
		});
		expect(isNonRetryable(ended)).toBe(true);
		expect(mutationRetry(0, ended)).toBe(false);
	});

	it('does not retry a forbidden mutation for roles without the write', () => {
		const forbidden = new ApiError('You do not have permission to perform this action', 403, {
			code: 'FORBIDDEN',
		});
		expect(isNonRetryable(forbidden)).toBe(true);
		expect(mutationRetry(0, forbidden)).toBe(false);
	});

	it('does not resend a rate-limited mutation', () => {
		expect(mutationRetry(0, new RateLimitedError(30))).toBe(false);
	});

	it('still retries a transient mutation failure once', () => {
		expect(mutationRetry(0, new ApiError('x', 503))).toBe(true);
		expect(mutationRetry(1, new ApiError('x', 503))).toBe(false);
	});
});
