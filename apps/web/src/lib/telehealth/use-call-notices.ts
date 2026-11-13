'use client';

import {useEffect, useState} from 'react';
import type {StageNotice} from '@/components/telehealth/call-stage/call-stage';
import {formatTime} from '@/lib/format/date';

export const ROOM_CLOSING_WARNING_MS = 5 * 60_000;
export const KEEP_ALIVE_NOTICE_TEXT =
	"You'll stay signed in while you're in a live visit. After the call, the usual 15-minute inactivity sign-out applies.";

const SHOWN_KEY_PREFIX = 'mcp:visit-keepalive-notice:';

/** Once per visit, per tab. Holds a flag only: no identifiers beyond the session id, no device data. */
function keepAliveNoticeAlreadyShown(sessionId: string): boolean {
	try {
		return window.sessionStorage.getItem(`${SHOWN_KEY_PREFIX}${sessionId}`) === '1';
	} catch {
		return false;
	}
}

function rememberKeepAliveNoticeShown(sessionId: string): void {
	try {
		window.sessionStorage.setItem(`${SHOWN_KEY_PREFIX}${sessionId}`, '1');
	} catch {
		// The notice may repeat after a reload when storage is blocked. That is harmless.
	}
}

export function closingSoonText(minutes: number, mediaExpiresAt: string): string {
	const unit = minutes === 1 ? 'minute' : 'minutes';
	return `This visit closes in ${minutes} ${unit}, at ${formatTime(mediaExpiresAt)}. Wrap up, or book a follow-up after the call.`;
}

/**
 * Non-modal stage notices (FE-064): the once-per-visit "stay signed in" message, and a warning 5
 * minutes before the room closes (`mediaExpiresAt`). No room extension exists in M22.
 */
export function useCallNotices({
	sessionId,
	mediaExpiresAt,
	keepAliveActive,
}: {
	sessionId: string;
	mediaExpiresAt?: string;
	keepAliveActive: boolean;
}): StageNotice[] {
	const [keepAliveDismissed, setKeepAliveDismissed] = useState(() => keepAliveNoticeAlreadyShown(sessionId));
	const [closingMinutes, setClosingMinutes] = useState<number | null>(null);

	useEffect(() => {
		if (!mediaExpiresAt) {
			return;
		}
		const expires = Date.parse(mediaExpiresAt);
		if (!Number.isFinite(expires) || expires <= Date.now()) {
			return;
		}
		const timer = setTimeout(
			() => setClosingMinutes(Math.max(1, Math.ceil((expires - Date.now()) / 60_000))),
			Math.max(0, expires - ROOM_CLOSING_WARNING_MS - Date.now()),
		);
		return () => clearTimeout(timer);
	}, [mediaExpiresAt]);

	const notices: StageNotice[] = [];
	if (keepAliveActive && !keepAliveDismissed) {
		notices.push({
			id: 'keep-alive',
			text: KEEP_ALIVE_NOTICE_TEXT,
			dismissLabel: 'Got it',
			onDismiss: () => {
				rememberKeepAliveNoticeShown(sessionId);
				setKeepAliveDismissed(true);
			},
		});
	}
	if (closingMinutes !== null && mediaExpiresAt) {
		notices.push({id: 'closing-soon', text: closingSoonText(closingMinutes, mediaExpiresAt)});
	}
	return notices;
}
