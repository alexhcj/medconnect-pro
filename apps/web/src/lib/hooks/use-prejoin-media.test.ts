import {act, renderHook, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {PREJOIN_DEVICE_STORAGE_KEY} from '@/lib/telehealth/prejoin-preferences';

const {createDailyCallObject, isDailyBrowserSupported} = vi.hoisted(() => ({
	createDailyCallObject: vi.fn(),
	isDailyBrowserSupported: vi.fn(() => true),
}));

vi.mock('@/lib/telehealth/daily-call-factory', () => ({createDailyCallObject, isDailyBrowserSupported}));

import {usePrejoinMedia} from '@/lib/hooks/use-prejoin-media';

type Handler = (event: unknown) => void;

function createFakeCall(options: {startCamera?: () => Promise<unknown>} = {}) {
	const handlers = new Map<string, Handler[]>();
	let destroyed = false;
	const videoTrack = {kind: 'video'} as MediaStreamTrack;
	const call = {
		on: vi.fn((name: string, handler: Handler) => {
			handlers.set(name, [...(handlers.get(name) ?? []), handler]);
			return call;
		}),
		emit: (name: string, event: unknown = {}) => handlers.get(name)?.forEach((handler) => handler(event)),
		join: vi.fn(),
		startCamera: vi.fn(options.startCamera ?? (async () => ({}))),
		enumerateDevices: vi.fn(async () => ({
			devices: [
				{kind: 'videoinput', deviceId: 'cam-1', label: 'Integrated Camera'},
				{kind: 'videoinput', deviceId: 'cam-2', label: ''},
				{kind: 'audioinput', deviceId: 'mic-1', label: 'Built-in Microphone'},
				{kind: 'audiooutput', deviceId: 'spk-1', label: 'Headphones'},
			],
		})),
		getInputDevices: vi.fn(async () => ({
			camera: {deviceId: 'cam-1'},
			mic: {deviceId: 'mic-1'},
			speaker: {deviceId: 'spk-1'},
		})),
		setInputDevicesAsync: vi.fn(async () => ({})),
		setOutputDeviceAsync: vi.fn(async () => ({})),
		updateInputSettings: vi.fn(async () => ({})),
		startLocalAudioLevelObserver: vi.fn(async () => undefined),
		stopLocalAudioLevelObserver: vi.fn(),
		participants: () => ({local: {tracks: {video: {persistentTrack: videoTrack}}}}),
		isDestroyed: () => destroyed,
		destroy: vi.fn(async () => {
			destroyed = true;
		}),
	};
	return call;
}

describe('usePrejoinMedia', () => {
	beforeEach(() => {
		createDailyCallObject.mockReset();
		isDailyBrowserSupported.mockReturnValue(true);
		window.localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('mock mode makes no Daily calls and offers a deterministic device list', () => {
		const {result} = renderHook(() => usePrejoinMedia({mock: true}));
		expect(createDailyCallObject).not.toHaveBeenCalled();
		expect(result.current.phase).toBe('ready');
		expect(result.current.cameras).toEqual([{deviceId: 'mock-camera', label: 'Integrated Camera'}]);
		expect(result.current.litSegments).toBe(8);
	});

	it('starts the local camera, lists devices and never joins', async () => {
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);
		const {result} = renderHook(() => usePrejoinMedia({mock: false}));

		await waitFor(() => expect(result.current.phase).toBe('ready'));
		expect(call.startCamera).toHaveBeenCalledTimes(1);
		expect(call.join).not.toHaveBeenCalled();
		expect(result.current.cameras.map((c) => c.label)).toEqual(['Integrated Camera', 'Camera 2']);
		expect(result.current.microphones).toHaveLength(1);
		expect(result.current.speakers).toHaveLength(1);
		expect(result.current.selection).toEqual({cameraId: 'cam-1', microphoneId: 'mic-1', speakerId: 'spk-1'});
		expect(result.current.videoTrack).not.toBeNull();
		expect(call.startLocalAudioLevelObserver).toHaveBeenCalled();
	});

	it('shows the microphone level as lit segments', async () => {
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);
		const {result} = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(result.current.phase).toBe('ready'));

		act(() => call.emit('local-audio-level', {audioLevel: 0.5}));
		expect(result.current.litSegments).toBe(6);
		act(() => call.emit('local-audio-level', {audioLevel: 4}));
		expect(result.current.litSegments).toBe(12);
	});

	it('maps a permission error to blocked and a missing camera to no camera', async () => {
		const blocked = createFakeCall();
		createDailyCallObject.mockReturnValue(blocked);
		const first = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(first.result.current.phase).toBe('ready'));
		act(() => blocked.emit('camera-error', {error: {type: 'permissions'}, errorMsg: {errorMsg: 'x'}}));
		expect(first.result.current.phase).toBe('blocked');
		first.unmount();

		const missing = createFakeCall();
		createDailyCallObject.mockReturnValue(missing);
		const second = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(second.result.current.phase).toBe('ready'));
		act(() =>
			missing.emit('camera-error', {
				error: {type: 'not-found', missingMedia: ['video']},
				errorMsg: {errorMsg: 'x', audioOk: true},
			}),
		);
		expect(second.result.current.phase).toBe('no_camera');
	});

	it('maps a rejected startCamera to blocked', async () => {
		createDailyCallObject.mockReturnValue(
			createFakeCall({startCamera: () => Promise.reject({name: 'NotAllowedError'})}),
		);
		const {result} = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(result.current.phase).toBe('blocked'));
	});

	it('reports an unsupported browser without creating a call object', () => {
		isDailyBrowserSupported.mockReturnValue(false);
		const {result} = renderHook(() => usePrejoinMedia({mock: false}));
		expect(createDailyCallObject).not.toHaveBeenCalled();
		expect(result.current.browserSupported).toBe(false);
	});

	it('switches devices and remembers ids only', async () => {
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);
		const {result} = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(result.current.phase).toBe('ready'));

		await act(async () => {
			await result.current.selectCamera('cam-2');
			await result.current.selectSpeaker('spk-1');
		});
		expect(call.setInputDevicesAsync).toHaveBeenCalledWith({videoDeviceId: 'cam-2'});
		expect(call.setOutputDeviceAsync).toHaveBeenCalledWith({outputDeviceId: 'spk-1'});
		const stored = JSON.parse(window.localStorage.getItem(PREJOIN_DEVICE_STORAGE_KEY) ?? '{}');
		expect(stored).toEqual({cameraId: 'cam-2', microphoneId: 'mic-1', speakerId: 'spk-1'});
	});

	it('does not overwrite remembered devices just by listing them', async () => {
		window.localStorage.setItem(PREJOIN_DEVICE_STORAGE_KEY, JSON.stringify({cameraId: 'cam-2'}));
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);
		const {result} = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(result.current.phase).toBe('ready'));
		expect(JSON.parse(window.localStorage.getItem(PREJOIN_DEVICE_STORAGE_KEY) ?? '{}')).toEqual({cameraId: 'cam-2'});
	});

	it('drops the background and says so when Daily reports a processor error', async () => {
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);
		const {result} = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(result.current.phase).toBe('ready'));
		await act(async () => {
			await result.current.setBackground({kind: 'blur'});
		});
		act(() => call.emit('nonfatal-error', {type: 'video-processor-error', errorMsg: 'x'}));
		expect(result.current.background).toEqual({kind: 'none'});
		expect(result.current.notice).toMatch(/background effect could not start/i);
	});

	it('uses a remembered device only while it is still available', async () => {
		window.localStorage.setItem(
			PREJOIN_DEVICE_STORAGE_KEY,
			JSON.stringify({cameraId: 'cam-2', microphoneId: 'mic-gone'}),
		);
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);
		const {result} = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(call.setInputDevicesAsync).toHaveBeenCalledWith({videoDeviceId: 'cam-2'}));
		expect(call.setInputDevicesAsync).not.toHaveBeenCalledWith({audioDeviceId: 'mic-gone'});
		await waitFor(() => expect(result.current.selection.cameraId).toBe('cam-2'));
	});

	it('applies a background and falls back to none when the effect fails', async () => {
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);
		const {result} = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(result.current.phase).toBe('ready'));

		await act(async () => {
			await result.current.setBackground({kind: 'blur'});
		});
		expect(call.updateInputSettings).toHaveBeenCalledWith({
			video: {processor: {type: 'background-blur', config: {strength: 0.6}}},
		});
		expect(result.current.background).toEqual({kind: 'blur'});

		call.updateInputSettings.mockRejectedValueOnce(new Error('processor failed'));
		await act(async () => {
			await result.current.setBackground({kind: 'image', imageId: 'nurse-station'});
		});
		expect(result.current.background).toEqual({kind: 'blur'});
		expect(result.current.notice).toMatch(/background effect could not start/i);
	});

	it('destroys the preview call object on release and on unmount, without ever joining', async () => {
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);
		const {result, unmount} = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(result.current.phase).toBe('ready'));

		await act(async () => {
			await result.current.release();
		});
		expect(call.destroy).toHaveBeenCalledTimes(1);

		const second = createFakeCall();
		createDailyCallObject.mockReturnValue(second);
		const next = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(next.result.current.phase).toBe('ready'));
		next.unmount();
		await waitFor(() => expect(second.destroy).toHaveBeenCalled());
		expect(call.join).not.toHaveBeenCalled();
		expect(second.join).not.toHaveBeenCalled();
		unmount();
	});

	it('hands the choices to the join without any network call', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);
		const {result} = renderHook(() => usePrejoinMedia({mock: false}));
		await waitFor(() => expect(result.current.phase).toBe('ready'));
		await act(async () => {
			await result.current.setBackground({kind: 'blur'});
		});

		expect(result.current.getChoices(false)).toEqual({
			audioOnly: false,
			cameraId: 'cam-1',
			microphoneId: 'mic-1',
			speakerId: 'spk-1',
			background: {kind: 'blur'},
		});
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
