'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import type {
	DailyCall,
	DailyEventObjectCameraError,
	DailyEventObjectLocalAudioLevel,
	DailyEventObjectNonFatalError,
} from '@daily-co/daily-js';
import {createDailyCallObject, isDailyBrowserSupported} from '@/lib/telehealth/daily-call-factory';
import type {JoinChoices} from '@/lib/telehealth/join-choices';
import {
	DEFAULT_BACKGROUND,
	dailyProcessorFor,
	type BackgroundChoice,
} from '@/lib/telehealth/prejoin-backgrounds';
import {
	phaseFromDailyCameraError,
	phaseFromMediaError,
	type PrejoinPhase,
} from '@/lib/telehealth/prejoin-devices';
import {pickAvailableDevice, readRememberedDevices, rememberDevices} from '@/lib/telehealth/prejoin-preferences';

export const LEVEL_SEGMENTS = 12;

export interface PrejoinDeviceOption {
	deviceId: string;
	label: string;
}

export interface PrejoinSelection {
	cameraId?: string;
	microphoneId?: string;
	speakerId?: string;
}

const MOCK_CAMERAS: PrejoinDeviceOption[] = [{deviceId: 'mock-camera', label: 'Integrated Camera'}];
const MOCK_MICROPHONES: PrejoinDeviceOption[] = [{deviceId: 'mock-microphone', label: 'Built-in Microphone'}];
const MOCK_SPEAKERS: PrejoinDeviceOption[] = [{deviceId: 'mock-speaker', label: 'Headphones'}];
const MOCK_LEVEL = 8 / LEVEL_SEGMENTS;

/** Deterministic mock-mode devices for a phase. The camera is gone unless ready; the microphone survives no_camera. */
function mockSnapshot(phase: PrejoinPhase) {
	const hasCamera = phase === 'ready';
	const hasMicrophone = phase === 'ready' || phase === 'no_camera';
	return {
		cameras: hasCamera ? MOCK_CAMERAS : [],
		microphones: hasMicrophone ? MOCK_MICROPHONES : [],
		speakers: MOCK_SPEAKERS,
		selection: {
			cameraId: hasCamera ? 'mock-camera' : undefined,
			microphoneId: hasMicrophone ? 'mock-microphone' : undefined,
			speakerId: 'mock-speaker',
		} satisfies PrejoinSelection,
		level: hasMicrophone ? MOCK_LEVEL : 0,
	};
}

const BACKGROUND_FAILED = 'The background effect could not start. Your camera is unchanged.';

function toOptions(devices: MediaDeviceInfo[], kind: MediaDeviceKind, fallback: string): PrejoinDeviceOption[] {
	return devices
		.filter((device) => device.kind === kind && device.deviceId)
		.map((device, index) => ({deviceId: device.deviceId, label: device.label || `${fallback} ${index + 1}`}));
}

async function destroyCall(call: DailyCall | null): Promise<void> {
	if (!call || call.isDestroyed()) {
		return;
	}
	try {
		call.stopLocalAudioLevelObserver();
	} catch {
		// Not running.
	}
	try {
		await call.destroy();
	} catch {
		// Ignore Daily destroy failures; the tracks stop with the object.
	}
}

/**
 * The green room's local preview (FE-062). It owns a Daily call object that only starts the local
 * camera and microphone: it never calls `join()` and never asks Nest for a meeting token, so no
 * Daily room session exists until the real join (SEC-008 join-before-mint). Device, level and
 * background choices stay in this component's state and browser storage; none of it is sent anywhere.
 *
 * In mock mode there are no Daily calls: a fixed device list and a deterministic level.
 */
export function usePrejoinMedia({mock, mockPhase = 'ready'}: {mock: boolean; mockPhase?: PrejoinPhase}) {
	const [initialMock] = useState(() => mockSnapshot(mockPhase));
	const [phase, setPhase] = useState<PrejoinPhase>(mock ? mockPhase : 'checking');
	const [browserSupported, setBrowserSupported] = useState(true);
	const [cameras, setCameras] = useState<PrejoinDeviceOption[]>(mock ? initialMock.cameras : []);
	const [microphones, setMicrophones] = useState<PrejoinDeviceOption[]>(mock ? initialMock.microphones : []);
	const [speakers, setSpeakers] = useState<PrejoinDeviceOption[]>(mock ? initialMock.speakers : []);
	const [selection, setSelection] = useState<PrejoinSelection>(mock ? initialMock.selection : {});
	const [level, setLevel] = useState(mock ? initialMock.level : 0);
	const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
	const [background, setBackgroundState] = useState<BackgroundChoice>(DEFAULT_BACKGROUND);
	const [notice, setNotice] = useState<string | null>(null);
	const [attempt, setAttempt] = useState(0);

	const callRef = useRef<DailyCall | null>(null);
	const selectionRef = useRef<PrejoinSelection>(selection);
	const backgroundRef = useRef<BackgroundChoice>(DEFAULT_BACKGROUND);

	// Only a choice the user makes is remembered. Refreshing the device list must not overwrite it.
	const updateSelection = useCallback((patch: PrejoinSelection, persist = false) => {
		selectionRef.current = {...selectionRef.current, ...patch};
		setSelection(selectionRef.current);
		if (persist) {
			rememberDevices(selectionRef.current);
		}
	}, []);

	const release = useCallback(async () => {
		const call = callRef.current;
		callRef.current = null;
		setVideoTrack(null);
		await destroyCall(call);
	}, []);

	useEffect(() => {
		if (mock) {
			return;
		}
		if (!isDailyBrowserSupported()) {
			setBrowserSupported(false);
			setPhase('blocked');
			return;
		}

		let cancelled = false;
		setPhase('checking');
		setNotice(null);
		setLevel(0);
		setBackgroundState(DEFAULT_BACKGROUND);
		backgroundRef.current = DEFAULT_BACKGROUND;

		const call = createDailyCallObject();
		callRef.current = call;

		const syncTrack = () => {
			if (cancelled || call.isDestroyed()) {
				return;
			}
			const local = call.participants().local;
			setVideoTrack(local?.tracks.video.persistentTrack ?? local?.tracks.video.track ?? null);
		};

		const refreshDevices = async () => {
			try {
				const {devices} = await call.enumerateDevices();
				if (cancelled) {
					return;
				}
				const cams = toOptions(devices as MediaDeviceInfo[], 'videoinput', 'Camera');
				const mics = toOptions(devices as MediaDeviceInfo[], 'audioinput', 'Microphone');
				const outs = toOptions(devices as MediaDeviceInfo[], 'audiooutput', 'Speaker');
				setCameras(cams);
				setMicrophones(mics);
				setSpeakers(outs);
				const current = await call.getInputDevices();
				if (cancelled) {
					return;
				}
				const currentCamera = (current.camera as {deviceId?: string}).deviceId;
				const currentMic = (current.mic as {deviceId?: string}).deviceId;
				const currentSpeaker = (current.speaker as {deviceId?: string}).deviceId;
				updateSelection({
					cameraId: currentCamera ?? selectionRef.current.cameraId,
					microphoneId: currentMic ?? selectionRef.current.microphoneId,
					speakerId: currentSpeaker ?? selectionRef.current.speakerId,
				});
				return {cams, mics, outs};
			} catch {
				return undefined;
			}
		};

		const startLevel = () => {
			void call.startLocalAudioLevelObserver(100).catch(() => undefined);
		};

		const onCameraError = (event: DailyEventObjectCameraError) => {
			if (cancelled) {
				return;
			}
			const missing = (event.error as {missingMedia?: string[]} | undefined)?.missingMedia;
			setPhase(phaseFromDailyCameraError(event.error?.type, missing));
			if (event.errorMsg?.audioOk) {
				void refreshDevices();
				startLevel();
			}
		};
		const onLevel = (event: DailyEventObjectLocalAudioLevel) => {
			if (!cancelled) {
				setLevel(Math.min(1, Math.max(0, event.audioLevel)));
			}
		};
		const onNonFatalError = (event: DailyEventObjectNonFatalError) => {
			if (cancelled || event.type !== 'video-processor-error') {
				return;
			}
			backgroundRef.current = DEFAULT_BACKGROUND;
			setBackgroundState(DEFAULT_BACKGROUND);
			setNotice(BACKGROUND_FAILED);
		};

		call.on('camera-error', onCameraError);
		call.on('local-audio-level', onLevel);
		call.on('nonfatal-error', onNonFatalError);
		call.on('started-camera', syncTrack);
		call.on('participant-updated', syncTrack);
		call.on('available-devices-updated', () => void refreshDevices());

		void (async () => {
			try {
				await call.startCamera({startVideoOff: false, startAudioOff: false});
				if (cancelled) {
					return;
				}
				const lists = await refreshDevices();
				syncTrack();
				startLevel();
				setPhase((current) => (current === 'checking' ? 'ready' : current));

				// A remembered device is used only while it is still plugged in.
				const remembered = readRememberedDevices();
				const wantedCamera = pickAvailableDevice(lists?.cams ?? [], remembered.cameraId);
				const wantedMic = pickAvailableDevice(lists?.mics ?? [], remembered.microphoneId);
				const wantedSpeaker = pickAvailableDevice(lists?.outs ?? [], remembered.speakerId);
				if (wantedCamera && wantedCamera !== selectionRef.current.cameraId) {
					await call.setInputDevicesAsync({videoDeviceId: wantedCamera});
					updateSelection({cameraId: wantedCamera});
				}
				if (wantedMic && wantedMic !== selectionRef.current.microphoneId) {
					await call.setInputDevicesAsync({audioDeviceId: wantedMic});
					updateSelection({microphoneId: wantedMic});
				}
				if (wantedSpeaker && wantedSpeaker !== selectionRef.current.speakerId) {
					await call.setOutputDeviceAsync({outputDeviceId: wantedSpeaker});
					updateSelection({speakerId: wantedSpeaker});
				}
				syncTrack();
			} catch (error) {
				if (!cancelled) {
					setPhase((current) => (current === 'checking' ? phaseFromMediaError(error) : current));
				}
			}
		})();

		const onPageHide = () => void release();
		window.addEventListener('pagehide', onPageHide);

		return () => {
			cancelled = true;
			window.removeEventListener('pagehide', onPageHide);
			if (callRef.current === call) {
				callRef.current = null;
			}
			setVideoTrack(null);
			void destroyCall(call);
		};
	}, [mock, attempt, release, updateSelection]);

	const selectCamera = useCallback(
		async (deviceId: string) => {
			updateSelection({cameraId: deviceId}, true);
			const call = callRef.current;
			if (mock || !call || call.isDestroyed()) {
				return;
			}
			try {
				await call.setInputDevicesAsync({videoDeviceId: deviceId});
				const local = call.participants().local;
				setVideoTrack(local?.tracks.video.persistentTrack ?? local?.tracks.video.track ?? null);
			} catch (error) {
				setPhase(phaseFromMediaError(error));
			}
		},
		[mock, updateSelection],
	);

	const selectMicrophone = useCallback(
		async (deviceId: string) => {
			updateSelection({microphoneId: deviceId}, true);
			const call = callRef.current;
			if (mock || !call || call.isDestroyed()) {
				return;
			}
			try {
				await call.setInputDevicesAsync({audioDeviceId: deviceId});
			} catch {
				setNotice('That microphone could not be used. Pick another one.');
			}
		},
		[mock, updateSelection],
	);

	const selectSpeaker = useCallback(
		async (deviceId: string) => {
			updateSelection({speakerId: deviceId}, true);
			const call = callRef.current;
			if (mock || !call || call.isDestroyed()) {
				return;
			}
			try {
				await call.setOutputDeviceAsync({outputDeviceId: deviceId});
			} catch {
				setNotice('That speaker could not be used. Pick another one.');
			}
		},
		[mock, updateSelection],
	);

	const setBackground = useCallback(
		async (choice: BackgroundChoice) => {
			setNotice(null);
			const previous = backgroundRef.current;
			backgroundRef.current = choice;
			setBackgroundState(choice);
			const call = callRef.current;
			if (mock || !call || call.isDestroyed()) {
				return;
			}
			try {
				await call.updateInputSettings({video: {processor: dailyProcessorFor(choice, window.location.origin)}});
			} catch {
				backgroundRef.current = previous;
				setBackgroundState(previous);
				setNotice(BACKGROUND_FAILED);
			}
		},
		[mock],
	);

	const retry = useCallback(() => {
		if (mock) {
			// Mock mode: "Try again" and "Check again" succeed, so a blocked or no-camera screen can be left.
			const next = mockSnapshot('ready');
			selectionRef.current = next.selection;
			setCameras(next.cameras);
			setMicrophones(next.microphones);
			setSelection(next.selection);
			setLevel(next.level);
			setPhase('ready');
			return;
		}
		void release().then(() => setAttempt((value) => value + 1));
	}, [mock, release]);

	const getChoices = useCallback(
		(audioOnly: boolean): JoinChoices => ({
			audioOnly,
			cameraId: selectionRef.current.cameraId,
			microphoneId: selectionRef.current.microphoneId,
			speakerId: selectionRef.current.speakerId,
			background: backgroundRef.current,
		}),
		[],
	);

	return {
		phase,
		browserSupported,
		cameras,
		microphones,
		speakers,
		selection,
		level,
		litSegments: Math.round(level * LEVEL_SEGMENTS),
		videoTrack,
		background,
		notice,
		selectCamera,
		selectMicrophone,
		selectSpeaker,
		setBackground,
		retry,
		release,
		getChoices,
	};
}
