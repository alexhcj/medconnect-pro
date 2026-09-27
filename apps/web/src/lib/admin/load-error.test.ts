import {describe, expect, it} from 'vitest';
import {ApiError} from '@/lib/api/http';
import {adminLoadErrorMessage} from '@/lib/admin/load-error';

describe('adminLoadErrorMessage', () => {
	it('returns the ApiError message for live and not-found failures', () => {
		expect(
			adminLoadErrorMessage(
				new ApiError('Practice users are not available from the administration API', 404),
				'Unable to load practice users.',
			),
		).toBe('Practice users are not available from the administration API');
	});

	it('returns the fallback for mock Error objects', () => {
		expect(adminLoadErrorMessage(new Error('Mock: Failed to load practice users'), 'Unable to load practice users.')).toBe(
			'Unable to load practice users.',
		);
	});
});
