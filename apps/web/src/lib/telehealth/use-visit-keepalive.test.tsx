import {act, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ApiError, RateLimitedError} from '@/lib/api/http';

const heartbeat = vi.hoisted(() => vi.fn());
const getCurrentSession = vi.hoisted(() => vi.fn());
const extendSession = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/telehealth-api', () => ({telehealthAPI: {heartbeat}}));
vi.mock('@/lib/api/session-api', () => ({sessionAPI: {getCurrentSession, extendSession}}));

import {setLiveVisitActive} from '@/lib/telehealth/live-visit-flag';
import {
	HEARTBEAT_INTERVAL_MS,
	TOKEN_REFRESH_BELOW_MS,
	useVisitKeepAlive,
} from '@/lib/telehealth/use-visit-keepalive';

async function advance(ms: number) {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
}

describe('useVisitKeepAlive', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		heartbeat.mockReset().mockResolvedValue(undefined);
		extendSession.mockReset().mockResolvedValue({success: true, newExpiresAt: Date.now() + 900_000});
		getCurrentSession.mockReset().mockResolvedValue({expiresAt: Date.now() + 14 * 60_000});
	});

	afterEach(() => {
		setLiveVisitActive(false);
		vi.useRealTimers();
	});

	it('sends a heartbeat about every minute with no body, and stops on cleanup', async () => {
		const {unmount} = renderHook(() => useVisitKeepAlive({sessionId: 'session-1', active: true}));
		await advance(HEARTBEAT_INTERVAL_MS * 3);
		expect(heartbeat).toHaveBeenCalledTimes(3);
		expect(heartbeat).toHaveBeenCalledWith('session-1');

		unmount();
		await advance(HEARTBEAT_INTERVAL_MS * 3);
		expect(heartbeat).toHaveBeenCalledTimes(3);
	});

	it('does nothing while inactive', async () => {
		renderHook(() => useVisitKeepAlive({sessionId: 'session-1', active: false}));
		await advance(HEARTBEAT_INTERVAL_MS * 3);
		expect(heartbeat).not.toHaveBeenCalled();
	});

	it('keeps running in a hidden tab', async () => {
		Object.defineProperty(document, 'hidden', {configurable: true, get: () => true});
		renderHook(() => useVisitKeepAlive({sessionId: 'session-1', active: true}));
		await advance(HEARTBEAT_INTERVAL_MS * 2);
		expect(heartbeat).toHaveBeenCalledTimes(2);
		Object.defineProperty(document, 'hidden', {configurable: true, get: () => false});
	});

	it.each([404, 409])('stops for good on %i and reports the visit closed', async (status) => {
		heartbeat.mockRejectedValueOnce(new ApiError('closed', status));
		const onClosed = vi.fn();
		renderHook(() => useVisitKeepAlive({sessionId: 'session-1', active: true, onClosed}));
		await advance(HEARTBEAT_INTERVAL_MS * 4);
		expect(heartbeat).toHaveBeenCalledTimes(1);
		expect(onClosed).toHaveBeenCalledTimes(1);
	});

	it('backs off on 429 and sends the next heartbeat on the following interval', async () => {
		heartbeat.mockRejectedValueOnce(new RateLimitedError(30));
		const onClosed = vi.fn();
		renderHook(() => useVisitKeepAlive({sessionId: 'session-1', active: true, onClosed}));
		await advance(HEARTBEAT_INTERVAL_MS);
		expect(heartbeat).toHaveBeenCalledTimes(1);
		await advance(HEARTBEAT_INTERVAL_MS - 1);
		expect(heartbeat).toHaveBeenCalledTimes(1);
		await advance(1);
		expect(heartbeat).toHaveBeenCalledTimes(2);
		expect(onClosed).not.toHaveBeenCalled();
	});

	it('refreshes the access token before it lapses, and not while plenty remains', async () => {
		getCurrentSession.mockResolvedValue({expiresAt: Date.now() + TOKEN_REFRESH_BELOW_MS + 60_000});
		renderHook(() => useVisitKeepAlive({sessionId: 'session-1', active: true}));
		await advance(HEARTBEAT_INTERVAL_MS);
		expect(extendSession).not.toHaveBeenCalled();

		getCurrentSession.mockResolvedValue({expiresAt: Date.now() + TOKEN_REFRESH_BELOW_MS - 1000});
		await advance(HEARTBEAT_INTERVAL_MS);
		expect(extendSession).toHaveBeenCalledTimes(1);
	});

	it('keeps sending heartbeats when a refresh fails', async () => {
		getCurrentSession.mockResolvedValue({expiresAt: Date.now() + 60_000});
		extendSession.mockRejectedValue(new ApiError('nope', 500));
		renderHook(() => useVisitKeepAlive({sessionId: 'session-1', active: true}));
		await advance(HEARTBEAT_INTERVAL_MS * 2);
		expect(heartbeat).toHaveBeenCalledTimes(2);
	});
});
