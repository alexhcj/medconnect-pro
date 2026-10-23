import {Info} from 'lucide-react';
import {isPrPreview} from '@/lib/marketing/deploy-context';

/**
 * Labels a PR preview build of the marketing site so it is not mistaken for the live site (FE-048).
 * Renders nothing unless NEXT_PUBLIC_DEPLOY_CONTEXT is exactly `pr-preview`. In normal flow,
 * not dismissable, not focusable; a status note, not an alert. No "mock data" in the copy:
 * the marketing site has none.
 */
export function PreviewBanner() {
	if (!isPrPreview()) return null;

	return (
		<div
			role="status"
			className="flex items-start justify-center gap-2 border-b border-border-strong bg-warning-subtle px-4 py-2 text-center text-sm font-medium text-warning"
		>
			<span className="flex h-5 shrink-0 items-center">
				<Info className="h-4 w-4" aria-hidden="true" />
			</span>
			<span>PR preview · not the live demo</span>
		</div>
	);
}
