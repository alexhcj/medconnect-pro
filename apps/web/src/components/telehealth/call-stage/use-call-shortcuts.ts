'use client';

import {useEffect, useRef} from 'react';

/**
 * Call shortcuts need a modifier (WCAG 2.1.4): Alt/Option+M toggles the microphone and Alt/Option+V
 * the camera. Matched by physical key code so Option on a Mac, which types a different character,
 * still works. A single-character shortcut is never registered.
 */
export function useCallShortcuts({
	enabled,
	onToggleMicrophone,
	onToggleCamera,
}: {
	enabled: boolean;
	onToggleMicrophone: () => void;
	onToggleCamera: () => void;
}) {
	const handlers = useRef({onToggleMicrophone, onToggleCamera});
	useEffect(() => {
		handlers.current = {onToggleMicrophone, onToggleCamera};
	});

	useEffect(() => {
		if (!enabled) {
			return undefined;
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
				return;
			}
			if (event.code === 'KeyM') {
				event.preventDefault();
				handlers.current.onToggleMicrophone();
			} else if (event.code === 'KeyV') {
				event.preventDefault();
				handlers.current.onToggleCamera();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [enabled]);
}

/** "Option" on Apple platforms, "Alt" elsewhere, for tooltips. */
export function shortcutModifierLabel(): string {
	if (typeof navigator === 'undefined') {
		return 'Alt';
	}
	return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? 'Option' : 'Alt';
}
