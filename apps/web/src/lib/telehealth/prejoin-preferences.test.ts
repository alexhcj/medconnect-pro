import {describe, expect, it} from 'vitest';
import {
	pickAvailableDevice,
	PREJOIN_DEVICE_STORAGE_KEY,
	readRememberedDevices,
	rememberDevices,
} from '@/lib/telehealth/prejoin-preferences';

function memoryStorage(initial: Record<string, string> = {}): Storage {
	const data = new Map(Object.entries(initial));
	return {
		get length() {
			return data.size;
		},
		clear: () => data.clear(),
		getItem: (key) => data.get(key) ?? null,
		key: (index) => [...data.keys()][index] ?? null,
		removeItem: (key) => void data.delete(key),
		setItem: (key, value) => void data.set(key, value),
	};
}

describe('remembered devices', () => {
	it('round-trips device ids only', () => {
		const storage = memoryStorage();
		rememberDevices({cameraId: 'cam-1', microphoneId: 'mic-1', speakerId: 'spk-1'}, storage);
		expect(readRememberedDevices(storage)).toEqual({cameraId: 'cam-1', microphoneId: 'mic-1', speakerId: 'spk-1'});
	});

	it('drops unknown fields and non-string values', () => {
		const storage = memoryStorage({
			[PREJOIN_DEVICE_STORAGE_KEY]: JSON.stringify({cameraId: 'cam-1', label: 'Integrated Camera', microphoneId: 7}),
		});
		expect(readRememberedDevices(storage)).toEqual({cameraId: 'cam-1'});
	});

	it('returns nothing for corrupt JSON, missing storage or a throwing store', () => {
		expect(readRememberedDevices(memoryStorage({[PREJOIN_DEVICE_STORAGE_KEY]: '{oops'}))).toEqual({});
		expect(readRememberedDevices(null)).toEqual({});
		const throwing = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('blocked');
			},
		} as unknown as Storage;
		expect(readRememberedDevices(throwing)).toEqual({});
		expect(() => rememberDevices({cameraId: 'cam-1'}, throwing)).not.toThrow();
		expect(() => rememberDevices({cameraId: 'cam-1'}, null)).not.toThrow();
	});

	it('uses a remembered id only while the device is still present', () => {
		const available = [{deviceId: 'cam-1'}, {deviceId: 'cam-2'}];
		expect(pickAvailableDevice(available, 'cam-2')).toBe('cam-2');
		expect(pickAvailableDevice(available, 'cam-9')).toBeUndefined();
		expect(pickAvailableDevice(available, undefined)).toBeUndefined();
	});
});
