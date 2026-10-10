import {describe, expect, it} from 'vitest';
import {ApiError, RateLimitedError} from '@/lib/api/http';
import {classifyDailyMediaFailure, DAILY_MEDIA_FAILURE_COPY} from '@/lib/telehealth/media-failure';

describe('classifyDailyMediaFailure', () => {
	it('maps 502, 429, permission, and missing-device failures', () => {
		expect(
			classifyDailyMediaFailure(
				new ApiError('Live media is currently unavailable.', 502, {code: 'MEDIA_UNAVAILABLE'}),
			),
		).toBe('media_unavailable');
		expect(classifyDailyMediaFailure(new RateLimitedError(20))).toBe('rate_limited');
		expect(classifyDailyMediaFailure({name: 'NotAllowedError'})).toBe('permission');
		expect(classifyDailyMediaFailure({name: 'NotFoundError'})).toBe('no_device');
		expect(classifyDailyMediaFailure(new Error('network'))).toBe('generic');
	});
});

describe('DAILY_MEDIA_FAILURE_COPY', () => {
	it('keeps permission, missing-device, and 502 copy distinct', () => {
		expect(DAILY_MEDIA_FAILURE_COPY.permission).toContain('denied');
		expect(DAILY_MEDIA_FAILURE_COPY.no_device).toContain('No camera');
		expect(DAILY_MEDIA_FAILURE_COPY.media_unavailable).toBe('Live media is currently unavailable.');
		expect(DAILY_MEDIA_FAILURE_COPY.rate_limited).toContain('Too many attempts');
	});
});
