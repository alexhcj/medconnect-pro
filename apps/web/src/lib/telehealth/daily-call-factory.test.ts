import {beforeEach, describe, expect, it, vi} from 'vitest';

const {getCallInstance, createCallObject} = vi.hoisted(() => ({
	getCallInstance: vi.fn(),
	createCallObject: vi.fn(),
}));

vi.mock('@daily-co/daily-js', () => ({
	default: {getCallInstance, createCallObject, supportedBrowser: () => ({supported: true})},
}));

import {destroyDailyCall, whenDailyCallsDestroyed} from '@/lib/telehealth/daily-call-factory';

function fakeCall(destroy: () => Promise<void>) {
	let destroyed = false;
	return {
		isDestroyed: () => destroyed,
		destroy: vi.fn(async () => {
			await destroy();
			destroyed = true;
		}),
	};
}

describe('daily call factory', () => {
	beforeEach(() => {
		getCallInstance.mockReset();
		getCallInstance.mockReturnValue(undefined);
	});

	it('waits for a pending destroy before a new call object may be created', async () => {
		let release: () => void = () => {};
		const call = fakeCall(() => new Promise<void>((resolve) => (release = resolve)));
		void destroyDailyCall(call as never);

		let settled = false;
		const waiting = whenDailyCallsDestroyed().then(() => (settled = true));
		await Promise.resolve();
		expect(settled).toBe(false);

		release();
		await waiting;
		expect(settled).toBe(true);
	});

	it('destroys a leftover call instance that did not come through the factory', async () => {
		const stale = fakeCall(async () => undefined);
		getCallInstance.mockReturnValue(stale);
		await whenDailyCallsDestroyed();
		expect(stale.destroy).toHaveBeenCalledTimes(1);
	});

	it('never rejects when destroy fails', async () => {
		const call = fakeCall(async () => {
			throw new Error('boom');
		});
		await expect(destroyDailyCall(call as never)).resolves.toBeUndefined();
	});
});
