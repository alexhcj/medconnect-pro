'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {
	DailyCall,
	DailyEventObjectActiveSpeakerChange,
	DailyEventObjectNetworkConnectionEvent,
	DailyEventObjectNetworkQualityEvent,
	DailyParticipant,
} from '@daily-co/daily-js';
import {telehealthRealAPI} from '@/lib/api/telehealth-api';
import {
	buildStageTiles,
	findScreenShare,
	networkLevelFromState,
	type NetworkLevel,
	type ScreenShareView,
	type StageTile,
} from '@/lib/telehealth/call-participants';
import {
	canDailyShareScreen,
	createDailyCallObject,
	destroyDailyCall,
	whenDailyCallsDestroyed,
} from '@/lib/telehealth/daily-call-factory';
import {dailyJoinOptions, type JoinChoices} from '@/lib/telehealth/join-choices';
import {classifyDailyMediaFailure, type DailyMediaFailureKind} from '@/lib/telehealth/media-failure';
import {DEFAULT_BACKGROUND, dailyProcessorFor, type BackgroundChoice} from '@/lib/telehealth/prejoin-backgrounds';
import {rememberDevices} from '@/lib/telehealth/prejoin-preferences';
import {isUnconfiguredDailyRoomUrl} from '@/lib/telehealth/unconfigured-daily';
import type {TelehealthParticipant} from '@/types/medical/telehealth-session';

export const DAILY_MEDIA_CONNECTION_STATES = [
	'joining',
	'waiting_for_participant',
	'connected',
	'reconnecting',
	'failed',
	'not_configured',
] as const;

export type DailyMediaConnectionState = (typeof DAILY_MEDIA_CONNECTION_STATES)[number];

export interface DeviceOption {
	deviceId: string;
	label: string;
}

/** Device lists and the current choice. Browser-only: never sent to Nest or logged (SEC-013 scope 7). */
export interface CallDevices {
	cameras: DeviceOption[];
	microphones: DeviceOption[];
	speakers: DeviceOption[];
	cameraId?: string;
	microphoneId?: string;
	speakerId?: string;
}

const EMPTY_DEVICES: CallDevices = {cameras: [], microphones: [], speakers: []};

function remoteParticipants(call: DailyCall): DailyParticipant[] {
	return Object.values(call.participants()).filter((participant) => !participant.local);
}

function deviceOptions(devices: readonly MediaDeviceInfo[], kind: MediaDeviceKind, fallback: string): DeviceOption[] {
	return devices
		.filter((device) => device.kind === kind && device.deviceId)
		.map((device, index) => ({deviceId: device.deviceId, label: device.label || `${fallback} ${index + 1}`}));
}

function networkFromEvent(event: DailyEventObjectNetworkQualityEvent): NetworkLevel {
	if (event.networkState) {
		return networkLevelFromState(event.networkState);
	}
	return event.threshold === 'good' ? 'good' : event.threshold === 'low' ? 'fair' : 'poor';
}

async function teardownCall(call: DailyCall | null): Promise<void> {
	if (!call || call.isDestroyed()) {
		return;
	}
	try {
		await call.leave();
	} catch {
		// Nest end remains source of truth.
	}
	await destroyDailyCall(call);
}

export function useDailyMediaSession({
	sessionId,
	enabled,
	joinChoices,
	roster = [],
}: {
	sessionId: string;
	enabled: boolean;
	/** Device, background and audio-only choices from the green room (FE-062). Browser-only. */
	joinChoices?: JoinChoices;
	/** Server roster (BE-027). Tile names and roles come from here, never from Daily `user_name`. */
	roster?: readonly TelehealthParticipant[];
}) {
	const joinChoicesRef = useRef(joinChoices);
	const [attempt, setAttempt] = useState(0);
	const [connectionState, setConnectionState] = useState<DailyMediaConnectionState>('joining');
	const [cameraOn, setCameraOn] = useState(false);
	const [microphoneOn, setMicrophoneOn] = useState(false);
	const [screenShareOn, setScreenShareOn] = useState(false);
	const [participants, setParticipants] = useState<DailyParticipant[]>([]);
	const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
	const [localNetwork, setLocalNetwork] = useState<NetworkLevel>('unknown');
	const [canShareScreen, setCanShareScreen] = useState(true);
	const [devices, setDevices] = useState<CallDevices>(EMPTY_DEVICES);
	const [background, setBackgroundChoice] = useState<BackgroundChoice>(
		joinChoices?.background ?? DEFAULT_BACKGROUND,
	);
	const [failureKind, setFailureKind] = useState<DailyMediaFailureKind>('none');

	const callRef = useRef<DailyCall | null>(null);
	const tokenRef = useRef<string | null>(null);
	const cancelledRef = useRef(false);
	const reconnectingRef = useRef(false);

	const applySnapshot = useCallback((call: DailyCall) => {
		const all = Object.values(call.participants());
		const hasRemote = remoteParticipants(call).length > 0;
		setConnectionState(reconnectingRef.current ? 'reconnecting' : hasRemote ? 'connected' : 'waiting_for_participant');
		setCameraOn(call.localVideo());
		setMicrophoneOn(call.localAudio());
		const local = all.find((participant) => participant.local);
		setScreenShareOn(call.localScreenVideo() || Boolean(local?.tracks?.screenVideo?.persistentTrack));
		setParticipants(all);
	}, []);

	const leaveAndDestroy = useCallback(async () => {
		cancelledRef.current = true;
		tokenRef.current = null;
		const call = callRef.current;
		callRef.current = null;
		await teardownCall(call);
	}, []);

	const refreshDevices = useCallback(async (call: DailyCall) => {
		try {
			const {devices: found} = await call.enumerateDevices();
			const list = found as MediaDeviceInfo[];
			const current = await call.getInputDevices();
			if (cancelledRef.current) {
				return;
			}
			setDevices({
				cameras: deviceOptions(list, 'videoinput', 'Camera'),
				microphones: deviceOptions(list, 'audioinput', 'Microphone'),
				speakers: deviceOptions(list, 'audiooutput', 'Speaker'),
				cameraId: (current.camera as {deviceId?: string} | undefined)?.deviceId,
				microphoneId: (current.mic as {deviceId?: string} | undefined)?.deviceId,
				speakerId: (current.speaker as {deviceId?: string} | undefined)?.deviceId,
			});
		} catch {
			// Device lists are a convenience; the call keeps its current devices.
		}
	}, []);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		cancelledRef.current = false;
		reconnectingRef.current = false;
		setConnectionState('joining');
		setFailureKind('none');
		setCameraOn(false);
		setMicrophoneOn(false);
		setScreenShareOn(false);
		setParticipants([]);
		setActiveSpeakerId(null);
		setLocalNetwork('unknown');

		let call: DailyCall | null = null;

		const sync = () => {
			if (!call || cancelledRef.current) {
				return;
			}
			applySnapshot(call);
		};

		const onNetwork = (event: DailyEventObjectNetworkConnectionEvent) => {
			if (cancelledRef.current) {
				return;
			}
			if (event.event === 'interrupted') {
				reconnectingRef.current = true;
				if (call) {
					applySnapshot(call);
				} else {
					setConnectionState('reconnecting');
				}
				return;
			}
			if (event.event === 'connected') {
				reconnectingRef.current = false;
				if (call) {
					applySnapshot(call);
				}
			}
		};

		const onQuality = (event: DailyEventObjectNetworkQualityEvent) => {
			if (!cancelledRef.current) {
				setLocalNetwork(networkFromEvent(event));
			}
		};

		const onSpeaker = (event: DailyEventObjectActiveSpeakerChange) => {
			if (!cancelledRef.current) {
				setActiveSpeakerId(event.activeSpeaker?.peerId ?? null);
			}
		};

		const onError = (event: unknown) => {
			if (!cancelledRef.current) {
				setFailureKind(classifyDailyMediaFailure(event));
				setConnectionState('failed');
			}
		};

		void (async () => {
			try {
				const minted = await telehealthRealAPI.mintMediaToken(sessionId);
				if (cancelledRef.current) {
					return;
				}
				const unconfigured = isUnconfiguredDailyRoomUrl(minted.roomUrl);
				if (unconfigured) {
					setConnectionState('not_configured');
					return;
				}

				tokenRef.current = minted.token;
				await whenDailyCallsDestroyed();
				if (cancelledRef.current) {
					return;
				}
				call = createDailyCallObject();
				callRef.current = call;
				call.on('joined-meeting', sync);
				call.on('participant-joined', sync);
				call.on('participant-updated', sync);
				call.on('participant-left', sync);
				call.on('track-started', sync);
				call.on('track-stopped', sync);
				call.on('local-screen-share-started', sync);
				call.on('local-screen-share-stopped', sync);
				call.on('active-speaker-change', onSpeaker);
				call.on('network-quality-change', onQuality);
				call.on('error', onError);
				call.on('network-connection', onNetwork);

				const choices = joinChoicesRef.current;
				await call.join({
					url: minted.roomUrl,
					token: minted.token,
					...(choices ? dailyJoinOptions(choices, window.location.origin) : {}),
				});
				if (cancelledRef.current) {
					await teardownCall(call);
					return;
				}
				if (choices?.speakerId) {
					void call.setOutputDeviceAsync({outputDeviceId: choices.speakerId}).catch(() => undefined);
				}
				setCanShareScreen(canDailyShareScreen());
				applySnapshot(call);
				void refreshDevices(call);
			} catch (error) {
				if (cancelledRef.current) {
					return;
				}
				setFailureKind(classifyDailyMediaFailure(error));
				setConnectionState('failed');
			}
		})();

		return () => {
			cancelledRef.current = true;
			tokenRef.current = null;
			const current = callRef.current;
			callRef.current = null;
			void teardownCall(current ?? call);
		};
	}, [applySnapshot, enabled, refreshDevices, sessionId, attempt]);

	const liveCall = useCallback((): DailyCall | null => {
		const current = callRef.current;
		return current && !current.isDestroyed() ? current : null;
	}, []);

	const toggleCamera = useCallback(() => {
		const current = liveCall();
		if (!current) {
			return;
		}
		current.setLocalVideo(!current.localVideo());
		applySnapshot(current);
	}, [applySnapshot, liveCall]);

	const toggleMicrophone = useCallback(() => {
		const current = liveCall();
		if (!current) {
			return;
		}
		current.setLocalAudio(!current.localAudio());
		applySnapshot(current);
	}, [applySnapshot, liveCall]);

	const toggleScreenShare = useCallback(() => {
		const current = liveCall();
		if (!current) {
			return;
		}
		if (current.localScreenVideo()) {
			current.stopScreenShare();
		} else {
			current.startScreenShare();
		}
		applySnapshot(current);
	}, [applySnapshot, liveCall]);

	const chooseDevice = useCallback(
		async (kind: 'camera' | 'microphone' | 'speaker', deviceId: string) => {
			const current = liveCall();
			if (!current) {
				return;
			}
			try {
				if (kind === 'camera') {
					await current.setInputDevicesAsync({videoDeviceId: deviceId});
				} else if (kind === 'microphone') {
					await current.setInputDevicesAsync({audioDeviceId: deviceId});
				} else {
					await current.setOutputDeviceAsync({outputDeviceId: deviceId});
				}
			} catch {
				return;
			}
			setDevices((previous) => {
				const next = {...previous, [`${kind}Id`]: deviceId} as CallDevices;
				rememberDevices({cameraId: next.cameraId, microphoneId: next.microphoneId, speakerId: next.speakerId});
				return next;
			});
		},
		[liveCall],
	);

	const setBackground = useCallback(
		async (choice: BackgroundChoice) => {
			const current = liveCall();
			if (!current) {
				return;
			}
			try {
				await current.updateInputSettings({
					video: {processor: dailyProcessorFor(choice, window.location.origin)},
				});
				setBackgroundChoice(choice);
			} catch {
				// Keep the previous effect; the picker shows the unchanged choice.
			}
		},
		[liveCall],
	);

	const flipCamera = useCallback(async () => {
		const current = liveCall();
		if (!current) {
			return;
		}
		try {
			await current.cycleCamera({preferDifferentFacingMode: true});
			void refreshDevices(current);
		} catch {
			// A single-camera device has nothing to flip to.
		}
	}, [liveCall, refreshDevices]);

	const retry = useCallback(() => {
		cancelledRef.current = true;
		tokenRef.current = null;
		const current = callRef.current;
		callRef.current = null;
		void teardownCall(current).finally(() => {
			cancelledRef.current = false;
			setAttempt((value) => value + 1);
		});
	}, []);

	const tiles: StageTile[] = useMemo(
		() => buildStageTiles(participants, roster, activeSpeakerId, localNetwork),
		[participants, roster, activeSpeakerId, localNetwork],
	);
	const screenShare: ScreenShareView | null = useMemo(
		() => findScreenShare(participants, roster),
		[participants, roster],
	);

	const controlsEnabled =
		connectionState === 'waiting_for_participant' ||
		connectionState === 'connected' ||
		connectionState === 'reconnecting';

	return {
		connectionState,
		cameraOn,
		microphoneOn,
		screenShareOn,
		tiles,
		screenShare,
		activeSpeakerId,
		networkLevel: localNetwork,
		canShareScreen,
		devices,
		background,
		failureKind,
		controlsEnabled,
		retry,
		toggleCamera,
		toggleMicrophone,
		toggleScreenShare,
		chooseDevice,
		setBackground,
		flipCamera,
		leaveAndDestroy,
	};
}
