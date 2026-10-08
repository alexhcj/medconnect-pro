import {describe, expect, it} from 'vitest';
import {isUnconfiguredDailyRoomUrl, UNCONFIGURED_DAILY_HOST} from '@/lib/telehealth/unconfigured-daily';

describe('isUnconfiguredDailyRoomUrl', () => {
	it('detects the Fake adapter origin', () => {
		expect(isUnconfiguredDailyRoomUrl(`https://${UNCONFIGURED_DAILY_HOST}/mcp-session`)).toBe(true);
	});

	it('rejects real Daily rooms and invalid URLs', () => {
		expect(isUnconfiguredDailyRoomUrl('https://example.daily.co/mcp-session')).toBe(false);
		expect(isUnconfiguredDailyRoomUrl('not-a-url')).toBe(false);
	});
});
