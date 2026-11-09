'use client';

import {useEffect, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';

/**
 * Renders the call stage as a full-viewport layer on `document.body`, outside the dashboard shell
 * (no sidebar or header) while the route, the auth gate and the concurrent-session dialog stay as
 * they are. The dashboard tree is made `inert` while the stage is open, so Tab and screen readers
 * stay on the call. Headless UI dialogs portal to their own root and are not affected.
 */
export function CallStagePortal({children}: {children: ReactNode}) {
	const [host, setHost] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const element = document.createElement('div');
		element.setAttribute('data-call-stage-root', '');
		document.body.appendChild(element);

		const main = document.getElementById('main-content');
		const covered: HTMLElement[] = [];
		for (const child of Array.from(document.body.children)) {
			if (child instanceof HTMLElement && child !== element && main && child.contains(main) && !child.hasAttribute('inert')) {
				child.setAttribute('inert', '');
				covered.push(child);
			}
		}
		setHost(element);

		return () => {
			for (const child of covered) {
				child.removeAttribute('inert');
			}
			element.remove();
			setHost(null);
		};
	}, []);

	return host ? createPortal(children, host) : null;
}
