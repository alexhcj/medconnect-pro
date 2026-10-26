import {cn} from '@/lib/utils/utils';

const FOCUS_RING =
	'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas';

function Lockup() {
	return (
		<>
			<span
				className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-inverse"
				aria-hidden="true"
			>
				MC
			</span>
			<span className="whitespace-nowrap text-lg font-semibold text-foreground max-[359px]:text-base">
				MedConnect Pro
			</span>
		</>
	);
}

/**
 * Logo and wordmark above the auth cards (FE-050). A plain anchor to the marketing site (a separate
 * app and origin, so not next/link), same tab. With no valid `href` it is non-link branding.
 * Below 360 px the wordmark shrinks to the approved Compact variant.
 */
export function AuthBrandLink({href}: {href: string | null}) {
	const base = 'inline-flex min-h-11 items-center gap-2 rounded-md px-2';
	if (!href) {
		return (
			<div className={base}>
				<Lockup />
			</div>
		);
	}
	return (
		<a href={href} aria-label="MedConnect Pro, back to home" className={cn(base, FOCUS_RING)}>
			<Lockup />
		</a>
	);
}

/** "← Back to home" text link under the auth card. Renders nothing without a valid `href`. */
export function AuthBackHomeLink({href}: {href: string | null}) {
	if (!href) return null;
	return (
		<a
			href={href}
			className={cn(
				'inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-brand hover:underline',
				FOCUS_RING,
			)}
		>
			<span aria-hidden="true">←&nbsp;</span>Back to home
		</a>
	);
}
