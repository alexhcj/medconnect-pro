'use client';

import {useCallback, useEffect, useMemo, useReducer} from 'react';
import {isPrPreview} from '@/lib/deploy-context';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {checkApiHealth} from '@/lib/api/health-api';
import {wakePing} from '@/lib/api/wake-ping';
import {
	apiStatusReducer,
	initialApiStatusState,
	isProbing,
	type ApiStatusState,
} from '@/lib/api-status/api-status-machine';

/** Gap between probes while waking. Stays well under the auth and global rate limits. */
export const PROBE_BACKOFF_MS = [2000, 3000, 5000, 8000, 10_000] as const;
/** How long the first probe may stay unanswered before the card opens in the waking state. */
export const CHECKING_GRACE_MS = 3000;

export interface ApiStatusControls {
	/** False in mock mode and PR previews: no indicator, no ping, no probe. */
	enabled: boolean;
	state: ApiStatusState;
	/** First field focus: wake ping, then start checking. Idempotent. */
	begin: () => void;
	retry: () => void;
	toggle: () => void;
	close: () => void;
	/** A submit failed with a `ServiceWakingError`: the API is asleep again. */
	reportSubmitWake: () => void;
	/** A submit was queued behind the wake: replay the attention cue. */
	markQueued: () => void;
}

export function apiStatusEnabled(): boolean {
	return !isMockMode() && !isPrPreview();
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		const timer = setTimeout(resolve, ms);
		signal.addEventListener(
			'abort',
			() => {
				clearTimeout(timer);
				resolve();
			},
			{once: true},
		);
	});
}

export function useApiStatus(options?: {enabled?: boolean}): ApiStatusControls {
	const enabled = options?.enabled ?? apiStatusEnabled();
	const [state, dispatch] = useReducer(apiStatusReducer, initialApiStatusState);
	const probing = isProbing(state.phase);

	// Probe /health with backoff while checking or waking. Stops on a 200, so a healthy API is
	// never polled (polling would keep the free tier awake and defeat spin-down).
	useEffect(() => {
		if (!probing) {
			return;
		}
		const controller = new AbortController();
		void (async () => {
			for (let attempt = 0; !controller.signal.aborted; attempt += 1) {
				const ok = await checkApiHealth(controller.signal);
				if (controller.signal.aborted) {
					return;
				}
				if (ok) {
					dispatch({type: 'healthOk'});
					return;
				}
				dispatch({type: 'healthFailed', now: Date.now()});
				await sleep(PROBE_BACKOFF_MS[Math.min(attempt, PROBE_BACKOFF_MS.length - 1)], controller.signal);
			}
		})();
		return () => controller.abort();
	}, [probing, state.cycle]);

	useEffect(() => {
		if (state.phase !== 'checking') {
			return;
		}
		const timer = setTimeout(() => dispatch({type: 'healthFailed', now: Date.now()}), CHECKING_GRACE_MS);
		return () => clearTimeout(timer);
	}, [state.phase]);

	useEffect(() => {
		if (state.phase !== 'waking') {
			return;
		}
		const timer = setInterval(() => dispatch({type: 'tick', now: Date.now()}), 1000);
		return () => clearInterval(timer);
	}, [state.phase]);

	const begin = useCallback(() => {
		if (!enabled) {
			return;
		}
		wakePing();
		dispatch({type: 'begin'});
	}, [enabled]);
	const retry = useCallback(() => dispatch({type: 'retry', now: Date.now()}), []);
	const toggle = useCallback(() => dispatch({type: 'toggle'}), []);
	const close = useCallback(() => dispatch({type: 'close'}), []);
	const reportSubmitWake = useCallback(() => {
		if (enabled) {
			dispatch({type: 'submitWake', now: Date.now()});
		}
	}, [enabled]);
	const markQueued = useCallback(() => dispatch({type: 'queued'}), []);

	return useMemo(
		() => ({enabled, state, begin, retry, toggle, close, reportSubmitWake, markQueued}),
		[enabled, state, begin, retry, toggle, close, reportSubmitWake, markQueued],
	);
}
