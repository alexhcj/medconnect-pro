import {isPrPreview} from '@/lib/marketing/deploy-context';
import {apiOrigin, appLoginHref} from '@/lib/marketing/public-urls';

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
 * Wakes the sleeping free-tier API (ADR-017) with an unauthenticated, cookieless no-cors
 * `GET {api origin}/health`. Skipped when no API origin is configured, in PR previews, for
 * automated browsers and inside the dedupe window. Returns whether a request was sent.
 */
export function wakePing(): boolean {
	const origin = apiOrigin();
	if (!origin || typeof window === 'undefined' || isPrPreview() || navigator.webdriver) {
		return false;
	}
	const now = Date.now();
	if (cooldownActive(now)) {
		return false;
	}
	recordPing(now);
	void fetch(`${origin}/health`, {
		method: 'GET',
		mode: 'no-cors',
		credentials: 'omit',
		keepalive: true,
		cache: 'no-store',
	}).catch(() => undefined);
	return true;
}

/**
 * Gesture handler for the sign-in links. Only a trusted user gesture (hover, focus or click) on a
 * link to the application sign-in page wakes the API, never page load or a scripted event.
 */
export function wakePingOnSignInGesture(event: Event): boolean {
	if (!event.isTrusted || !(event.target instanceof Element)) {
		return false;
	}
	const link = event.target.closest('a[href]');
	if (!link) {
		return false;
	}
	let target: URL;
	try {
		target = new URL(link.getAttribute('href') ?? '', window.location.href);
	} catch {
		return false;
	}
	if (target.href !== appLoginHref()) {
		return false;
	}
	return wakePing();
}

/** Test seam: clears the in-memory dedupe window. */
export function resetWakePingForTests(): void {
	lastPingAt = 0;
}
