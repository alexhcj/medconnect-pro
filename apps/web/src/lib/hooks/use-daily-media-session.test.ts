import {act, renderHook, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {DailyCall, DailyParticipant} from '@daily-co/daily-js';
import {ApiError} from '@/lib/api/http';

const {createDailyCallObject, mintMediaToken} = vi.hoisted(() => ({
	createDailyCallObject: vi.fn(),
	mintMediaToken: vi.fn(),
}));

vi.mock('@/lib/telehealth/daily-call-factory', () => ({
	createDailyCallObject,
}));

vi.mock('@/lib/api/telehealth-api', () => ({
	telehealthRealAPI: {
		mintMediaToken,
	},
}));

import {useDailyMediaSession} from '@/lib/hooks/use-daily-media-session';

const sessionId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function participant(overrides: {local: boolean; session_id: string; user_name?: string}): DailyParticipant {
	return {
		user_id: overrides.session_id,
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
		addRemote() {
			participants.remote = participant({local: false, session_id: 'remote', user_name: 'Avery Quinn'});
		},
	};

	return call as unknown as DailyCall & {
		emit: (event: string, payload?: unknown) => void;
		addRemote: () => void;
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
		expect(result.current.remoteParticipantName).toBe('Avery Quinn');
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
