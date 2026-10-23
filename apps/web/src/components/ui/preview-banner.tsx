import React from 'react';
import {Info} from 'lucide-react';
import {isPrPreview} from '@/lib/deploy-context';

/**
 * Labels a PR preview build so mock data is not mistaken for the live demo (FE-048).
 * Renders nothing unless NEXT_PUBLIC_DEPLOY_CONTEXT is exactly `pr-preview`. Takes its own space
 * above the app shell and stays at the top while scrolling (sticky), so the fixed dashboard
 * sidebar, offset by PREVIEW_BANNER_HEIGHT, never covers it. Not dismissable, not focusable;
 * a status note, not an alert.
 */
export function PreviewBanner() {
	if (!isPrPreview()) return null;

	return (
		<div
			role="status"
			className="sticky top-0 z-50 flex items-start justify-center gap-2 border-b border-border-strong bg-warning-subtle px-4 py-2 text-center text-sm font-medium text-warning"
		>
			<span className="flex h-5 shrink-0 items-center">
				<Info className="h-4 w-4" aria-hidden="true" />
			</span>
			<span>PR preview · mock data · not the live demo</span>
		</div>
	);
}
