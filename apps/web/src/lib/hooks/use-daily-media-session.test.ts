import {act, renderHook, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {DailyCall, DailyParticipant} from '@daily-co/daily-js';
import {ApiError} from '@/lib/api/http';

const {createDailyCallObject, mintMediaToken, destroyDailyCall} = vi.hoisted(() => ({
	createDailyCallObject: vi.fn(),
	mintMediaToken: vi.fn(),
	destroyDailyCall: async (call: {destroy: () => Promise<unknown>; isDestroyed: () => boolean} | null) => {
		if (call && !call.isDestroyed()) {
			await call.destroy();
		}
	},
}));

vi.mock('@/lib/telehealth/daily-call-factory', () => ({
	createDailyCallObject,
	destroyDailyCall,
	canDailyShareScreen: () => true,
	whenDailyCallsDestroyed: async () => undefined,
}));

vi.mock('@/lib/api/telehealth-api', () => ({
	telehealthRealAPI: {
		mintMediaToken,
	},
}));

import {useDailyMediaSession} from '@/lib/hooks/use-daily-media-session';

const sessionId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function participant(overrides: {
	local: boolean;
	session_id: string;
	user_id?: string;
	user_name?: string;
	networkQualityState?: DailyParticipant['networkQualityState'];
}): DailyParticipant {
	return {
		user_id: overrides.user_id ?? overrides.session_id,
		networkQualityState: overrides.networkQualityState,
		user_name: overrides.user_name ?? (overrides.local ? 'You' : 'Avery Quinn'),
		session_id: overrides.session_id,
		local: overrides.local,
		owner: false,
		record: false,
		will_eject_at: new Date(0),
		permissions: {
			hasPresence: true,
			canSend: true,
			canReceive: {
				base: {video: true, audio: true, screenVideo: true, screenAudio: true, customVideo: {'*': true}, customAudio: {'*': true}},
				byUserId: {},
			},
			canAdmin: false,
		},
		audio: false,
		video: false,
		screen: false,
		cam_info: {},
		screen_info: {},
		tracks: {
			audio: {subscribed: true, state: 'off'},
			video: {subscribed: true, state: 'off'},
			screenAudio: {subscribed: true, state: 'off'},
			screenVideo: {subscribed: true, state: 'off'},
		},
	} as DailyParticipant;
}

function createFakeCall() {
	const handlers = new Map<string, Set<(event: unknown) => void>>();
	const participants: Record<string, DailyParticipant> = {
		local: participant({local: true, session_id: 'local'}),
	};
	let localVideo = true;
	let localAudio = true;
	let localScreen = false;
	let destroyed = false;

	const call = {
		join: vi.fn(async () => {
			handlers.get('joined-meeting')?.forEach((handler) => handler({action: 'joined-meeting'}));
			return participants;
		}),
		leave: vi.fn(async () => undefined),
		destroy: vi.fn(async () => {
			destroyed = true;
		}),
		isDestroyed: () => destroyed,
		participants: () => participants,
		localVideo: () => localVideo,
		localAudio: () => localAudio,
		localScreenVideo: () => localScreen,
		setLocalVideo: vi.fn((enabled: boolean) => {
			localVideo = enabled;
			return call;
		}),
		setLocalAudio: vi.fn((enabled: boolean) => {
			localAudio = enabled;
			return call;
		}),
		startScreenShare: vi.fn(() => {
			localScreen = true;
		}),
		stopScreenShare: vi.fn(() => {
			localScreen = false;
		}),
		enumerateDevices: vi.fn(async () => ({devices: []})),
		getInputDevices: vi.fn(async () => ({camera: {}, mic: {}, speaker: {}})),
		setInputDevicesAsync: vi.fn(async () => ({})),
		setOutputDeviceAsync: vi.fn(async () => ({})),
		updateInputSettings: vi.fn(async () => ({})),
		cycleCamera: vi.fn(async () => ({})),
		on: vi.fn((event: string, handler: (event: unknown) => void) => {
			const set = handlers.get(event) ?? new Set();
			set.add(handler);
			handlers.set(event, set);
			return call;
		}),
		off: vi.fn((event: string, handler: (event: unknown) => void) => {
			handlers.get(event)?.delete(handler);
			return call;
		}),
		emit(event: string, payload: unknown = {}) {
			handlers.get(event)?.forEach((handler) => handler(payload));
		},
		addRemote(overrides: {session_id?: string; user_id?: string; user_name?: string} = {}) {
			const session_id = overrides.session_id ?? 'remote';
			participants[session_id] = participant({local: false, session_id, ...overrides});
		},
	};

	return call as unknown as DailyCall & {
		emit: (event: string, payload?: unknown) => void;
		addRemote: (overrides?: {session_id?: string; user_id?: string; user_name?: string}) => void;
		updateInputSettings: ReturnType<typeof vi.fn>;
		setInputDevicesAsync: ReturnType<typeof vi.fn>;
		join: ReturnType<typeof vi.fn>;
		leave: ReturnType<typeof vi.fn>;
		destroy: ReturnType<typeof vi.fn>;
		setLocalVideo: ReturnType<typeof vi.fn>;
		setLocalAudio: ReturnType<typeof vi.fn>;
		startScreenShare: ReturnType<typeof vi.fn>;
		stopScreenShare: ReturnType<typeof vi.fn>;
	};
}

describe('useDailyMediaSession', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	beforeEach(() => {
		mintMediaToken.mockResolvedValue({
			roomUrl: 'https://example.daily.co/mcp-session',
			token: 'meeting-token',
		});
	});

	it('joins Daily and waits for a remote participant', async () => {
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);

		const {result} = renderHook(() => useDailyMediaSession({sessionId, enabled: true}));

		await waitFor(() => {
			expect(result.current.connectionState).toBe('waiting_for_participant');
		});
		expect(mintMediaToken).toHaveBeenCalledWith(sessionId);
		expect(call.join).toHaveBeenCalledWith({
			url: 'https://example.daily.co/mcp-session',
			token: 'meeting-token',
		});
		expect(result.current.controlsEnabled).toBe(true);
	});

	it('becomes connected when a remote Daily participant joins', async () => {
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);

		const {result} = renderHook(() => useDailyMediaSession({sessionId, enabled: true}));
		await waitFor(() => {
			expect(result.current.connectionState).toBe('waiting_for_participant');
		});

		act(() => {
			call.addRemote();
			call.emit('participant-joined');
		});

		await waitFor(() => {
			expect(result.current.connectionState).toBe('connected');
		});
	});

	describe('stage tiles', () => {
		const roster = [
			{userId: 'u-provider', displayName: 'Dr. Jordan Ellis', role: 'PROVIDER' as const},
			{userId: 'u-patient', displayName: 'Avery Quinn', role: 'PATIENT' as const},
			{userId: 'u-nurse', displayName: 'Riley Chen', role: 'NURSE' as const},
		];

		async function joinThreeWay() {
			const call = createFakeCall();
			createDailyCallObject.mockReturnValue(call);
			const hook = renderHook(() => useDailyMediaSession({sessionId, enabled: true, roster}));
			await waitFor(() => {
				expect(hook.result.current.connectionState).toBe('waiting_for_participant');
			});
			act(() => {
				call.addRemote({session_id: 'r-patient', user_id: 'u-patient', user_name: 'Dr. Totally Legit'});
				call.addRemote({session_id: 'r-nurse', user_id: 'u-nurse'});
				call.emit('participant-joined');
			});
			return {call, ...hook};
		}

		it('names three tiles from the roster and ignores a renamed Daily user_name', async () => {
			const {result} = await joinThreeWay();

			await waitFor(() => expect(result.current.tiles).toHaveLength(3));
			const byId = Object.fromEntries(result.current.tiles.map((tile) => [tile.id, tile]));
			expect(byId['r-patient']).toMatchObject({name: 'Avery Quinn', role: 'PATIENT'});
			expect(byId['r-nurse']).toMatchObject({name: 'Riley Chen', role: 'NURSE'});
			expect(result.current.tiles[0].isLocal).toBe(true);
		});

		it('marks the active speaker and maps network quality', async () => {
			const {call, result} = await joinThreeWay();

			act(() => {
				call.emit('active-speaker-change', {action: 'active-speaker-change', activeSpeaker: {peerId: 'r-nurse'}});
				call.emit('network-quality-change', {action: 'network-quality-change', networkState: 'warning'});
			});

			await waitFor(() => expect(result.current.networkLevel).toBe('fair'));
			expect(result.current.activeSpeakerId).toBe('r-nurse');
			expect(result.current.tiles.find((tile) => tile.id === 'r-nurse')?.speaking).toBe(true);
			expect(result.current.tiles.find((tile) => tile.isLocal)?.network).toBe('fair');
		});

		it('switches devices and background on the call without involving Nest', async () => {
			const {call, result} = await joinThreeWay();

			await act(async () => {
				await result.current.chooseDevice('camera', 'cam-2');
				await result.current.setBackground({kind: 'blur'});
			});

			expect(call.setInputDevicesAsync).toHaveBeenCalledWith({videoDeviceId: 'cam-2'});
			expect(call.updateInputSettings).toHaveBeenCalledWith({
				video: {processor: {type: 'background-blur', config: {strength: 0.6}}},
			});
			expect(result.current.devices.cameraId).toBe('cam-2');
			expect(result.current.background).toEqual({kind: 'blur'});
			expect(mintMediaToken).toHaveBeenCalledTimes(1);
		});
	});

	it('toggles camera, microphone, and screen share on the Daily call', async () => {
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);

		const {result} = renderHook(() => useDailyMediaSession({sessionId, enabled: true}));
		await waitFor(() => {
			expect(result.current.connectionState).toBe('waiting_for_participant');
		});

		act(() => {
			result.current.toggleCamera();
			result.current.toggleMicrophone();
			result.current.toggleScreenShare();
		});

		expect(call.setLocalVideo).toHaveBeenCalledWith(false);
		expect(call.setLocalAudio).toHaveBeenCalledWith(false);
		expect(call.startScreenShare).toHaveBeenCalledOnce();
		expect(result.current.cameraOn).toBe(false);
		expect(result.current.microphoneOn).toBe(false);
		expect(result.current.screenShareOn).toBe(true);
	});

	it('skips Daily when Nest returns an unconfigured room URL', async () => {
		mintMediaToken.mockResolvedValue({
			roomUrl: 'https://unconfigured.invalid/mcp-session',
			token: 'fake-meeting-token',
		});

		const {result} = renderHook(() => useDailyMediaSession({sessionId, enabled: true}));

		await waitFor(() => {
			expect(result.current.connectionState).toBe('not_configured');
		});
		expect(createDailyCallObject).not.toHaveBeenCalled();
		expect(result.current.controlsEnabled).toBe(false);
	});

	it('maps 502 MEDIA_UNAVAILABLE to failed', async () => {
		mintMediaToken.mockRejectedValue(
			new ApiError('Live media is currently unavailable.', 502, {code: 'MEDIA_UNAVAILABLE'}),
		);

		const {result} = renderHook(() => useDailyMediaSession({sessionId, enabled: true}));

		await waitFor(() => {
			expect(result.current.connectionState).toBe('failed');
		});
		expect(result.current.failureKind).toBe('media_unavailable');
		expect(createDailyCallObject).not.toHaveBeenCalled();
	});

	it('leaves and destroys Daily on end', async () => {
		const call = createFakeCall();
		createDailyCallObject.mockReturnValue(call);

		const {result} = renderHook(() => useDailyMediaSession({sessionId, enabled: true}));
		await waitFor(() => {
			expect(result.current.connectionState).toBe('waiting_for_participant');
		});

		await act(async () => {
			await result.current.leaveAndDestroy();
		});

		expect(call.leave).toHaveBeenCalledOnce();
		expect(call.destroy).toHaveBeenCalledOnce();
	});
});
