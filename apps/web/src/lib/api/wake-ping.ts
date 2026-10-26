import {isPrPreview} from '@/lib/deploy-context';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {nestApiBaseUrl} from '@/lib/api/nest-api';

/** Dedupe window per tab and, through localStorage, across tabs (FE-049). */
export const WAKE_PING_WINDOW_MS = 60_000;
export const WAKE_PING_STORAGE_KEY = 'mcp_wake_ping_at';

let lastPingAt = 0;

function cooldownActive(now: number): boolean {
	if (now - lastPingAt < WAKE_PING_WINDOW_MS) {
		return true;
	}
	try {
		const stored = Number(window.localStorage.getItem(WAKE_PING_STORAGE_KEY));
		return Number.isFinite(stored) && stored > 0 && now - stored < WAKE_PING_WINDOW_MS;
	} catch {
		return false;
	}
}

function recordPing(now: number): void {
	lastPingAt = now;
	try {
		window.localStorage.setItem(WAKE_PING_STORAGE_KEY, String(now));
	} catch {
		// Storage can be blocked. The in-memory window still dedupes this tab.
	}
}

/**
 * Wakes the sleeping free-tier API (ADR-017) with an unauthenticated `GET /health`: no cookies, no
 * body read. Skipped in mock mode, PR previews, automated browsers and inside the dedupe window.
 * Returns whether a request was sent.
 */
export function wakePing(): boolean {
	if (typeof window === 'undefined' || isMockMode() || isPrPreview()) {
		return false;
	}
	if (navigator.webdriver) {
		return false;
	}
	const now = Date.now();
	if (cooldownActive(now)) {
		return false;
	}
	recordPing(now);
	void fetch(`${nestApiBaseUrl()}/health`, {
		method: 'GET',
		mode: 'no-cors',
		credentials: 'omit',
		keepalive: true,
		cache: 'no-store',
	}).catch(() => undefined);
	return true;
}

/** Test seam: clears the in-memory dedupe window. */
export function resetWakePingForTests(): void {
	lastPingAt = 0;
}
