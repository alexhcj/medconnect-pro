import {act, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
	closingSoonText,
	KEEP_ALIVE_NOTICE_TEXT,
	ROOM_CLOSING_WARNING_MS,
	useCallNotices,
} from '@/lib/telehealth/use-call-notices';

const NOW = Date.parse('2026-10-29T14:00:00.000Z');

describe('useCallNotices', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
		window.sessionStorage.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('shows the stay-signed-in notice once per visit, then remembers the dismissal', () => {
		const first = renderHook(() => useCallNotices({sessionId: 's1', keepAliveActive: true}));
		expect(first.result.current.map((notice) => notice.text)).toEqual([KEEP_ALIVE_NOTICE_TEXT]);

		act(() => first.result.current[0].onDismiss?.());
		expect(first.result.current).toEqual([]);
		first.unmount();

		const second = renderHook(() => useCallNotices({sessionId: 's1', keepAliveActive: true}));
		expect(second.result.current).toEqual([]);

		const otherVisit = renderHook(() => useCallNotices({sessionId: 's2', keepAliveActive: true}));
		expect(otherVisit.result.current).toHaveLength(1);
	});

	it('does not show the notice while the keep-alive is not running', () => {
		const {result} = renderHook(() => useCallNotices({sessionId: 's1', keepAliveActive: false}));
		expect(result.current).toEqual([]);
	});

	it('warns 5 minutes before the room closes, and not earlier', async () => {
		const mediaExpiresAt = new Date(NOW + 20 * 60_000).toISOString();
		const {result} = renderHook(() =>
			useCallNotices({sessionId: 's1', mediaExpiresAt, keepAliveActive: false}),
		);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(15 * 60_000 - 1);
		});
		expect(result.current).toEqual([]);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});
		expect(result.current).toHaveLength(1);
		expect(result.current[0].id).toBe('closing-soon');
		expect(result.current[0].text).toBe(closingSoonText(5, mediaExpiresAt));
		expect(result.current[0].text).toMatch(/closes in 5 minutes, at \d{1,2}:\d{2} (AM|PM)/);
		expect(result.current[0].onDismiss).toBeUndefined();
	});

	it('warns right away, with the minutes left, when joining inside the last 5 minutes', async () => {
		const mediaExpiresAt = new Date(NOW + 3 * 60_000 - 10_000).toISOString();
		const {result} = renderHook(() =>
			useCallNotices({sessionId: 's1', mediaExpiresAt, keepAliveActive: false}),
		);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(result.current[0].text).toContain('closes in 3 minutes');
	});

	it('says nothing once the room has already closed', async () => {
		const mediaExpiresAt = new Date(NOW - 1000).toISOString();
		const {result} = renderHook(() =>
			useCallNotices({sessionId: 's1', mediaExpiresAt, keepAliveActive: false}),
		);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(ROOM_CLOSING_WARNING_MS);
		});
		expect(result.current).toEqual([]);
	});
});
