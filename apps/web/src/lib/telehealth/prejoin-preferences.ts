/**
 * Remembers the last-used device ids in this browser (SEC-013 scope 7). Ids only: no labels, no
 * network data, no background choice. Nothing here is sent to Nest or logged. Storage can be missing
 * or throw (private window, blocked site data), so every access is wrapped and the green room works
 * without it.
 */
export const PREJOIN_DEVICE_STORAGE_KEY = 'mcp_telehealth_prejoin_devices';

export interface RememberedDevices {
	cameraId?: string;
	microphoneId?: string;
	speakerId?: string;
}

const FIELDS = ['cameraId', 'microphoneId', 'speakerId'] as const;

function browserStorage(): Storage | null {
	try {
		return typeof window === 'undefined' ? null : window.localStorage;
	} catch {
		return null;
	}
}

export function readRememberedDevices(storage: Storage | null = browserStorage()): RememberedDevices {
	if (!storage) {
		return {};
	}
	try {
		const raw = storage.getItem(PREJOIN_DEVICE_STORAGE_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : null;
		if (!parsed || typeof parsed !== 'object') {
			return {};
		}
		const result: RememberedDevices = {};
		for (const field of FIELDS) {
			const value = (parsed as Record<string, unknown>)[field];
			if (typeof value === 'string' && value.length > 0 && value.length <= 512) {
				result[field] = value;
			}
		}
		return result;
	} catch {
		return {};
	}
}

export function rememberDevices(devices: RememberedDevices, storage: Storage | null = browserStorage()): void {
	if (!storage) {
		return;
	}
	const clean: RememberedDevices = {};
	for (const field of FIELDS) {
		const value = devices[field];
		if (value) {
			clean[field] = value;
		}
	}
	try {
		storage.setItem(PREJOIN_DEVICE_STORAGE_KEY, JSON.stringify(clean));
	} catch {
		// Convenience only.
	}
}

/** A remembered id is used only while that device is still plugged in. */
export function pickAvailableDevice(
	available: readonly {deviceId: string}[],
	rememberedId: string | undefined,
): string | undefined {
	return rememberedId && available.some((device) => device.deviceId === rememberedId) ? rememberedId : undefined;
}
