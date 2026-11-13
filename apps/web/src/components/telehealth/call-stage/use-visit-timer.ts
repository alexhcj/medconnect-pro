'use client';

import {useEffect, useState} from 'react';

export function formatElapsed(totalSeconds: number): string {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	const mm = String(m).padStart(2, '0');
	const ss = String(s).padStart(2, '0');
	return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Elapsed visit time. It counts from the session's `joinedAt` when Nest sent one, otherwise from
 * the moment the stage mounted, and ticks once a second.
 */
export function useVisitTimer(joinedAt?: string): string {
	const [mountedAt] = useState(() => Date.now());
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const interval = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(interval);
	}, []);

	const parsed = joinedAt ? Date.parse(joinedAt) : Number.NaN;
	const start = Number.isNaN(parsed) || parsed > now ? mountedAt : parsed;
	return formatElapsed((now - start) / 1000);
}
