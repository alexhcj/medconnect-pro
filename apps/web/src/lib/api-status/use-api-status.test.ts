import {act, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@/lib/api/health-api', () => ({checkApiHealth: vi.fn()}));
vi.mock('@/lib/api/wake-ping', () => ({wakePing: vi.fn()}));

import {checkApiHealth} from '@/lib/api/health-api';
import {wakePing} from '@/lib/api/wake-ping';
import {
	CHECKING_GRACE_MS,
	PROBE_BACKOFF_MS,
	useApiStatus,
} from '@/lib/api-status/use-api-status';

const health = vi.mocked(checkApiHealth);

/** Advances in 500 ms acts so effects created by a state change run before the next timer. */
async function flush(ms = 0) {
	if (ms === 0) {
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		return;
	}
	for (let left = ms; left > 0; left -= 500) {
		await act(async () => {
			await vi.advanceTimersByTimeAsync(Math.min(500, left));
		});
	}
}

describe('useApiStatus', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-10-25T10:00:00Z'));
		health.mockReset();
		vi.mocked(wakePing).mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('does nothing until begin: no ping, no probe', async () => {
		renderHook(() => useApiStatus({enabled: true}));
		await flush(30_000);
		expect(health).not.toHaveBeenCalled();
		expect(wakePing).not.toHaveBeenCalled();
	});

	it('is inert when disabled (mock mode or PR preview)', async () => {
		const {result} = renderHook(() => useApiStatus({enabled: false}));
		act(() => result.current.begin());
		act(() => result.current.reportSubmitWake());
		await flush(10_000);
		expect(result.current.state.phase).toBe('idle');
		expect(wakePing).not.toHaveBeenCalled();
		expect(health).not.toHaveBeenCalled();
	});

	it('pings, probes once and collapses to ready when the API is awake; then never polls', async () => {
		health.mockResolvedValue(true);
		const {result} = renderHook(() => useApiStatus({enabled: true}));
		act(() => result.current.begin());
		await flush();
		expect(wakePing).toHaveBeenCalledTimes(1);
		expect(result.current.state).toMatchObject({phase: 'ready', expanded: false});
		expect(health).toHaveBeenCalledTimes(1);
		await flush(120_000);
		expect(health).toHaveBeenCalledTimes(1);
	});

	it('auto-expands to waking, backs off, and stops polling on a 200', async () => {
		health.mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValue(true);
		const {result} = renderHook(() => useApiStatus({enabled: true}));
		act(() => result.current.begin());
		await flush();
		expect(result.current.state).toMatchObject({phase: 'waking', expanded: true});
		expect(health).toHaveBeenCalledTimes(1);
		await flush(PROBE_BACKOFF_MS[0]);
		expect(health).toHaveBeenCalledTimes(2);
		await flush(PROBE_BACKOFF_MS[1]);
		expect(health).toHaveBeenCalledTimes(3);
		expect(result.current.state).toMatchObject({phase: 'ready', expanded: false});
		await flush(60_000);
		expect(health).toHaveBeenCalledTimes(3);
	});

	it('opens the waking card after the grace period when the first probe hangs', async () => {
		health.mockImplementation(() => new Promise<boolean>(() => undefined));
		const {result} = renderHook(() => useApiStatus({enabled: true}));
		act(() => result.current.begin());
		await flush(CHECKING_GRACE_MS - 1);
		expect(result.current.state.phase).toBe('checking');
		await flush(2);
		expect(result.current.state).toMatchObject({phase: 'waking', expanded: true});
	});

	it('counts elapsed seconds, gives up near 90 s, stops polling, and retries on demand', async () => {
		health.mockResolvedValue(false);
		const {result} = renderHook(() => useApiStatus({enabled: true}));
		act(() => result.current.begin());
		await flush(23_000);
		expect(result.current.state.phase).toBe('waking');
		expect(result.current.state.elapsedSeconds).toBeGreaterThanOrEqual(19);
		await flush(80_000);
		expect(result.current.state).toMatchObject({phase: 'unreachable', expanded: true});
		const calls = health.mock.calls.length;
		await flush(60_000);
		expect(health.mock.calls.length).toBe(calls);

		health.mockResolvedValue(true);
		act(() => result.current.retry());
		await flush();
		expect(result.current.state.phase).toBe('ready');
	});

	it('restarts the cycle when a submit finds the API asleep again', async () => {
		health.mockResolvedValue(true);
		const {result} = renderHook(() => useApiStatus({enabled: true}));
		act(() => result.current.begin());
		await flush();
		expect(result.current.state.phase).toBe('ready');
		health.mockResolvedValueOnce(false).mockResolvedValue(true);
		act(() => result.current.reportSubmitWake());
		expect(result.current.state).toMatchObject({phase: 'waking', expanded: true});
		await flush(PROBE_BACKOFF_MS[0] + 10);
		expect(result.current.state.phase).toBe('ready');
	});
});
