export type PrejoinDeviceStatus = 'idle' | 'checking' | 'ready' | 'permission_denied' | 'no_device';

export function classifyGetUserMediaError(error: unknown): Exclude<PrejoinDeviceStatus, 'idle' | 'checking' | 'ready'> {
	const name = error && typeof error === 'object' && 'name' in error ? String((error as {name: unknown}).name) : '';
	if (name === 'NotFoundError' || name === 'OverconstrainedError') {
		return 'no_device';
	}
	return 'permission_denied';
}

export async function checkPrejoinDevices(): Promise<PrejoinDeviceStatus> {
	const mediaDevices = globalThis.navigator?.mediaDevices;
	if (!mediaDevices?.getUserMedia) {
		return 'ready';
	}
	try {
		const stream = await mediaDevices.getUserMedia({audio: true, video: true});
		for (const track of stream.getTracks()) {
			track.stop();
		}
		return 'ready';
	} catch (error) {
		return classifyGetUserMediaError(error);
	}
}

export const PREJOIN_DEVICE_COPY: Record<Exclude<PrejoinDeviceStatus, 'idle' | 'checking'>, string> = {
	ready: 'Camera and microphone are ready.',
	permission_denied:
		'Camera or microphone access was denied. You can still join and retry devices during the call.',
	no_device: 'No camera or microphone was found. You can still join the visit.',
};
