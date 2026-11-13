'use client';

import {useEffect, useRef} from 'react';
import {ApiError} from '@/lib/api/http';
import {queryClient} from '@/lib/api/api';
import {sessionAPI} from '@/lib/api/session-api';
import {telehealthAPI} from '@/lib/api/telehealth-api';
import {setLiveVisitActive} from '@/lib/telehealth/live-visit-flag';
import type {SessionInfo} from '@/types/auth/session';

/** About once a minute (SEC-013). A 60 s interval stays well inside the 15 min idle limit. */
export const HEARTBEAT_INTERVAL_MS = 60_000;
/**
 * Refresh the access token while less than this remains. Above the 10 minute warning banner
 * threshold, so a live visit never shows "session expiring" over the call stage.
 */
export const TOKEN_REFRESH_BELOW_MS = 12 * 60_000;

/** Keep-alive stops for good on these: the visit is gone, ended or no longer eligible. */
function isTerminal(error: unknown): boolean {
	return error instanceof ApiError && (error.status === 404 || error.status === 409);
}

async function refreshTokenIfDue(): Promise<void> {
	try {
		const current = await sessionAPI.getCurrentSession();
		if (current.expiresAt - Date.now() >= TOKEN_REFRESH_BELOW_MS) {
			return;
		}
		const extended = await sessionAPI.extendSession();
		queryClient.setQueryData(['session', 'current'], (old: SessionInfo | undefined) =>
			old ? {...old, expiresAt: extended.newExpiresAt} : old,
		);
	} catch {
		// A failed refresh is not fatal here: the usual expiry warning takes over.
	}
}

/**
 * In-visit keep-alive (FE-064, SEC-013). While `active`, sends `POST .../heartbeat` about every
 * minute (also in a hidden tab, because it is a timer chain and not a query) and refreshes the
 * access token before it lapses. Stops on cleanup (Leave call, End visit), 404 and 409. A 429
 * waits for the next interval. No body and no device data.
 */
export function useVisitKeepAlive({
	sessionId,
	active,
	onClosed,
}: {
	sessionId: string;
	active: boolean;
	/** The server says the visit is over or no longer eligible. */
	onClosed?: () => void;
}): void {
	const onClosedRef = useRef(onClosed);
	useEffect(() => {
		onClosedRef.current = onClosed;
	}, [onClosed]);

	useEffect(() => {
		if (!active) {
			return;
		}
		let stopped = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		setLiveVisitActive(true);

		const tick = async () => {
			if (stopped) {
				return;
			}
			try {
				await telehealthAPI.heartbeat(sessionId);
			} catch (error) {
				if (stopped) {
					return;
				}
				if (isTerminal(error)) {
					stopped = true;
					setLiveVisitActive(false);
					onClosedRef.current?.();
					return;
				}
				// 429 and transient failures: try again on the next interval.
			}
			if (stopped) {
				return;
			}
			await refreshTokenIfDue();
			if (!stopped) {
				timer = setTimeout(() => void tick(), HEARTBEAT_INTERVAL_MS);
			}
		};

		void refreshTokenIfDue();
		timer = setTimeout(() => void tick(), HEARTBEAT_INTERVAL_MS);

		return () => {
			stopped = true;
			if (timer) {
				clearTimeout(timer);
			}
			setLiveVisitActive(false);
		};
	}, [active, sessionId]);
}
