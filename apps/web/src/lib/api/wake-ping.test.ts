import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
	resetWakePingForTests,
	WAKE_PING_STORAGE_KEY,
	WAKE_PING_WINDOW_MS,
	wakePing,
} from '@/lib/api/wake-ping';

describe('wakePing', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-10-25T10:00:00Z'));
		vi.stubEnv('NODE_ENV', 'production');
		vi.stubEnv('NEXT_PUBLIC_USE_MOCKS', 'false');
		vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '/mcp-api');
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({}));
		resetWakePingForTests();
		window.localStorage.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
		Object.defineProperty(navigator, 'webdriver', {value: false, configurable: true});
	});

	it('sends one cookieless no-cors GET /health', () => {
		expect(wakePing()).toBe(true);
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(fetch).toHaveBeenCalledWith(
			'/mcp-api/health',
			expect.objectContaining({
				method: 'GET',
				mode: 'no-cors',
				credentials: 'omit',
				keepalive: true,
			}),
		);
	});

	it('dedupes inside the 60 s window and fires again after it', () => {
		expect(wakePing()).toBe(true);
		expect(wakePing()).toBe(false);
		vi.advanceTimersByTime(WAKE_PING_WINDOW_MS + 1);
		expect(wakePing()).toBe(true);
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('honours the cross-tab localStorage cooldown', () => {
		window.localStorage.setItem(WAKE_PING_STORAGE_KEY, String(Date.now() - 10_000));
		expect(wakePing()).toBe(false);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('still pings when storage is blocked', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		expect(wakePing()).toBe(true);
		vi.restoreAllMocks();
	});

	it('sends nothing for an automated browser', () => {
		Object.defineProperty(navigator, 'webdriver', {value: true, configurable: true});
		expect(wakePing()).toBe(false);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('sends nothing in mock mode', () => {
		vi.stubEnv('NEXT_PUBLIC_USE_MOCKS', 'true');
		expect(wakePing()).toBe(false);
	});

	it('sends nothing in a PR preview', () => {
		vi.stubEnv('NEXT_PUBLIC_DEPLOY_CONTEXT', 'pr-preview');
		expect(wakePing()).toBe(false);
	});
});
