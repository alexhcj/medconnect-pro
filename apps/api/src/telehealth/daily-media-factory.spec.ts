import {describe, expect, it} from 'vitest';
import {createDailyMediaAdapter} from './daily-media-factory.js';
import {DailyRestAdapter} from './daily-rest-adapter.js';
import {FakeDailyAdapter} from './fake-daily-adapter.js';

describe('createDailyMediaAdapter', () => {
	it('uses the Fake adapter when DAILY_API_KEY is unset or empty', () => {
		expect(createDailyMediaAdapter(undefined)).toBeInstanceOf(FakeDailyAdapter);
		expect(createDailyMediaAdapter('')).toBeInstanceOf(FakeDailyAdapter);
	});

	it('uses the REST adapter when DAILY_API_KEY is set', () => {
		expect(createDailyMediaAdapter('daily-secret')).toBeInstanceOf(DailyRestAdapter);
	});
});
