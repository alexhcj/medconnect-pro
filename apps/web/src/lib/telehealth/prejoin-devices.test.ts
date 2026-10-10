import {afterEach, describe, expect, it, vi} from 'vitest';
import {
	checkPrejoinDevices,
	classifyGetUserMediaError,
	PREJOIN_DEVICE_COPY,
} from '@/lib/telehealth/prejoin-devices';

describe('classifyGetUserMediaError', () => {
	it('maps missing devices separately from permission denial', () => {
		expect(classifyGetUserMediaError({name: 'NotFoundError'})).toBe('no_device');
		expect(classifyGetUserMediaError({name: 'OverconstrainedError'})).toBe('no_device');
		expect(classifyGetUserMediaError({name: 'NotAllowedError'})).toBe('permission_denied');
		expect(classifyGetUserMediaError({name: 'NotReadableError'})).toBe('permission_denied');
	});
});

describe('checkPrejoinDevices', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns ready when getUserMedia is unavailable', async () => {
		vi.stubGlobal('navigator', {mediaDevices: undefined});
		await expect(checkPrejoinDevices()).resolves.toBe('ready');
	});

	it('stops tracks after a successful check', async () => {
		const stop = vi.fn();
		vi.stubGlobal('navigator', {
			mediaDevices: {
				getUserMedia: vi.fn().mockResolvedValue({
					getTracks: () => [{stop}, {stop}],
				}),
			},
		});

		await expect(checkPrejoinDevices()).resolves.toBe('ready');
		expect(stop).toHaveBeenCalledTimes(2);
	});

	it('returns permission_denied when the browser denies access', async () => {
		vi.stubGlobal('navigator', {
			mediaDevices: {
				getUserMedia: vi.fn().mockRejectedValue({name: 'NotAllowedError'}),
			},
		});
		await expect(checkPrejoinDevices()).resolves.toBe('permission_denied');
	});
});

describe('PREJOIN_DEVICE_COPY', () => {
	it('lets the visitor join after a denied or missing device', () => {
		expect(PREJOIN_DEVICE_COPY.permission_denied).toContain('still join');
		expect(PREJOIN_DEVICE_COPY.no_device).toContain('still join');
	});
});
