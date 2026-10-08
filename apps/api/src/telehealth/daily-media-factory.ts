import {DailyRestAdapter} from './daily-rest-adapter.js';
import type {DailyMediaPort} from './daily-media-port.js';
import {FakeDailyAdapter} from './fake-daily-adapter.js';

export function createDailyMediaAdapter(
	apiKey: string | undefined,
	fetchImpl: typeof fetch = fetch,
): DailyMediaPort {
	if (apiKey) {
		return new DailyRestAdapter(apiKey, fetchImpl);
	}
	return new FakeDailyAdapter();
}
