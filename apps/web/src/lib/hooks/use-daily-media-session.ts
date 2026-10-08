'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import type {DailyCall, DailyEventObjectNetworkConnectionEvent, DailyParticipant} from '@daily-co/daily-js';
import {ApiError} from '@/lib/api/http';
import {telehealthRealAPI} from '@/lib/api/telehealth-api';
import {createDailyCallObject} from '@/lib/telehealth/daily-call-factory';
import {isUnconfiguredDailyRoomUrl} from '@/lib/telehealth/unconfigured-daily';

export const DAILY_MEDIA_CONNECTION_STATES = [
	'joining',
	'waiting_for_participant',
	'connected',
	'reconnecting',
	'failed',
	'not_configured',
] as const;

export type DailyMediaConnectionState = (typeof DAILY_MEDIA_CONNECTION_STATES)[number];

export type DailyMediaSessionSnapshot = {
	connectionState: DailyMediaConnectionState;
	cameraOn: boolean;
	microphoneOn: boolean;
	screenShareOn: boolean;
	localVideoTrack: MediaStreamTrack | null;
	remoteVideoTrack: MediaStreamTrack | null;
	screenShareTrack: MediaStreamTrack | null;
	remoteParticipantName: string | null;
	controlsEnabled: boolean;
};

function remoteParticipants(call: DailyCall): DailyParticipant[] {
	return Object.values(call.participants()).filter((participant) => !participant.local);
}

function trackFrom(participant: DailyParticipant | undefined, kind: 'video' | 'screenVideo'): MediaStreamTrack | null {
	return participant?.tracks[kind]?.persistentTrack ?? participant?.tracks[kind]?.track ?? null;
}

function snapshotFromCall(
	call: DailyCall,
	connectionState: Exclude<DailyMediaConnectionState, 'joining' | 'failed' | 'not_configured'>,
): Omit<DailyMediaSessionSnapshot, 'controlsEnabled'> {
	const participants = Object.values(call.participants());
	const local = participants.find((participant) => participant.local);
	const remote = remoteParticipants(call)[0];
	const localScreen = trackFrom(local, 'screenVideo');
	const remoteScreen = trackFrom(remote, 'screenVideo');
	const hasRemote = Boolean(remote);

	return {
		connectionState: connectionState === 'reconnecting' ? 'reconnecting' : hasRemote ? 'connected' : 'waiting_for_participant',
		cameraOn: call.localVideo(),
		microphoneOn: call.localAudio(),
		screenShareOn: call.localScreenVideo() || Boolean(localScreen),
		localVideoTrack: trackFrom(local, 'video'),
		remoteVideoTrack: trackFrom(remote, 'video'),
		screenShareTrack: localScreen ?? remoteScreen,
		remoteParticipantName: remote?.user_name || null,
	};
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
	try {
		if (!call.isDestroyed()) {
			await call.destroy();
		}
	} catch {
		// Ignore Daily destroy failures.
	}
}

export function useDailyMediaSession({sessionId, enabled}: {sessionId: string; enabled: boolean}) {
	const [attempt, setAttempt] = useState(0);
	const [connectionState, setConnectionState] = useState<DailyMediaConnectionState>('joining');
	const [cameraOn, setCameraOn] = useState(false);
	const [microphoneOn, setMicrophoneOn] = useState(false);
	const [screenShareOn, setScreenShareOn] = useState(false);
	const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
	const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
	const [screenShareTrack, setScreenShareTrack] = useState<MediaStreamTrack | null>(null);
	const [remoteParticipantName, setRemoteParticipantName] = useState<string | null>(null);

	const callRef = useRef<DailyCall | null>(null);
	const tokenRef = useRef<string | null>(null);
	const cancelledRef = useRef(false);
	const reconnectingRef = useRef(false);

	const applySnapshot = useCallback((call: DailyCall) => {
		const snapshot = snapshotFromCall(call, reconnectingRef.current ? 'reconnecting' : 'connected');
		setConnectionState(snapshot.connectionState);
		setCameraOn(snapshot.cameraOn);
		setMicrophoneOn(snapshot.microphoneOn);
		setScreenShareOn(snapshot.screenShareOn);
		setLocalVideoTrack(snapshot.localVideoTrack);
		setRemoteVideoTrack(snapshot.remoteVideoTrack);
		setScreenShareTrack(snapshot.screenShareTrack);
		setRemoteParticipantName(snapshot.remoteParticipantName);
	}, []);

	const leaveAndDestroy = useCallback(async () => {
		cancelledRef.current = true;
		tokenRef.current = null;
		const call = callRef.current;
		callRef.current = null;
		await teardownCall(call);
	}, []);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		cancelledRef.current = false;
		reconnectingRef.current = false;
		setConnectionState('joining');
		setCameraOn(false);
		setMicrophoneOn(false);
		setScreenShareOn(false);
		setLocalVideoTrack(null);
		setRemoteVideoTrack(null);
		setScreenShareTrack(null);
		setRemoteParticipantName(null);

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

		const onError = () => {
			if (!cancelledRef.current) {
				setConnectionState('failed');
			}
		};

		void (async () => {
			try {
				const minted = await telehealthRealAPI.mintMediaToken(sessionId);
				if (cancelledRef.current) {
					return;
				}
				if (isUnconfiguredDailyRoomUrl(minted.roomUrl)) {
					setConnectionState('not_configured');
					return;
				}

				tokenRef.current = minted.token;
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
				call.on('error', onError);
				call.on('network-connection', onNetwork);

				await call.join({url: minted.roomUrl, token: minted.token});
				if (cancelledRef.current) {
					await teardownCall(call);
					return;
				}
				applySnapshot(call);
			} catch (error) {
				if (cancelledRef.current) {
					return;
				}
				if (error instanceof ApiError && error.status === 502) {
					setConnectionState('failed');
					return;
				}
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
	}, [applySnapshot, enabled, sessionId, attempt]);

	const toggleCamera = useCallback(() => {
		const current = callRef.current;
		if (!current || current.isDestroyed()) {
			return;
		}
		current.setLocalVideo(!current.localVideo());
		applySnapshot(current);
	}, [applySnapshot]);

	const toggleMicrophone = useCallback(() => {
		const current = callRef.current;
		if (!current || current.isDestroyed()) {
			return;
		}
		current.setLocalAudio(!current.localAudio());
		applySnapshot(current);
	}, [applySnapshot]);

	const toggleScreenShare = useCallback(() => {
		const current = callRef.current;
		if (!current || current.isDestroyed()) {
			return;
		}
		if (current.localScreenVideo()) {
			current.stopScreenShare();
		} else {
			current.startScreenShare();
		}
		applySnapshot(current);
	}, [applySnapshot]);

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

	const controlsEnabled =
		connectionState === 'waiting_for_participant' ||
		connectionState === 'connected' ||
		connectionState === 'reconnecting';

	return {
		connectionState,
		cameraOn,
		microphoneOn,
		screenShareOn,
		localVideoTrack,
		remoteVideoTrack,
		screenShareTrack,
		remoteParticipantName,
		controlsEnabled,
		retry,
		toggleCamera,
		toggleMicrophone,
		toggleScreenShare,
		leaveAndDestroy,
	};
}
