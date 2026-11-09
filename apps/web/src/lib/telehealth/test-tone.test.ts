import {describe, expect, it, vi} from 'vitest';
import {playTestTone, TEST_TONE_HZ} from '@/lib/telehealth/test-tone';

function fakeContext(options: {sink?: boolean} = {}) {
	const oscillator = {
		type: 'square',
		frequency: {value: 0},
		onended: null as (() => void) | null,
		connect: vi.fn(function (this: unknown, next: unknown) {
			return next;
		}),
		start: vi.fn(),
		stop: vi.fn(),
	};
	const gainParam = {setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn()};
	const context = {
		state: 'running',
		currentTime: 0,
		destination: {},
		createGain: vi.fn(() => ({gain: gainParam, connect: vi.fn((next: unknown) => next)})),
		createOscillator: vi.fn(() => oscillator),
		close: vi.fn().mockResolvedValue(undefined),
		...(options.sink ? {setSinkId: vi.fn().mockResolvedValue(undefined)} : {}),
	};
	return {context, oscillator};
}

describe('playTestTone', () => {
	it('plays a short sine tone and closes the context when it ends', async () => {
		const {context, oscillator} = fakeContext();
		const handle = playTestTone({createContext: () => context as never});
		await vi.waitFor(() => expect(oscillator.start).toHaveBeenCalled());
		expect(oscillator.type).toBe('sine');
		expect(oscillator.frequency.value).toBe(TEST_TONE_HZ);
		oscillator.onended?.();
		await handle.done;
		expect(context.close).toHaveBeenCalled();
	});

	it('routes to the chosen speaker when the browser supports it', async () => {
		const {context} = fakeContext({sink: true});
		playTestTone({outputDeviceId: 'spk-1', createContext: () => context as never});
		await vi.waitFor(() => expect(context.setSinkId).toHaveBeenCalledWith('spk-1'));
	});

	it('still plays through the default speaker when the browser cannot route output', async () => {
		const {context, oscillator} = fakeContext();
		playTestTone({outputDeviceId: 'spk-1', createContext: () => context as never});
		await vi.waitFor(() => expect(oscillator.start).toHaveBeenCalled());
	});

	it('stops on request and never rejects', async () => {
		const {context, oscillator} = fakeContext();
		const handle = playTestTone({createContext: () => context as never});
		await vi.waitFor(() => expect(oscillator.start).toHaveBeenCalled());
		handle.stop();
		await expect(handle.done).resolves.toBeUndefined();
		expect(oscillator.stop).toHaveBeenCalled();
	});

	it('resolves when audio is unavailable', async () => {
		const handle = playTestTone({
			createContext: () => {
				throw new Error('no audio');
			},
		});
		await expect(handle.done).resolves.toBeUndefined();
	});
});
