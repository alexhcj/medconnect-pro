import {useSyncExternalStore} from 'react';

/**
 * Whether the signed-in user is in a live visit right now (FE-064). The session banner and
 * extension modal stay quiet while it is true, because the keep-alive loop owns the session.
 * Browser-only, in memory: no identifiers, no persistence.
 */
let liveVisit = false;
const listeners = new Set<() => void>();

export function setLiveVisitActive(active: boolean): void {
	if (liveVisit === active) {
		return;
	}
	liveVisit = active;
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function useLiveVisitActive(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => liveVisit,
		() => false,
	);
}
