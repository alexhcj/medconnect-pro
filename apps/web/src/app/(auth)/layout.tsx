import {AuthBackHomeLink, AuthBrandLink} from '@/components/auth/auth-brand-link';
import {getMarketingUrl} from '@/lib/marketing-url';

/**
 * Shared frame for /login, /register and /email-verification (FE-050): brand header above the
 * page card and a "Back to home" link below it, both pointing at the marketing site. The OAuth
 * landing lives in the (oauth) group so it keeps no header. The bottom padding reserves room for
 * the fixed FE-049 status indicator on small screens.
 */
export default function AuthLayout({children}: {children: React.ReactNode}) {
	const marketingUrl = getMarketingUrl();
	return (
		<div className="flex min-h-screen flex-col items-center gap-3 bg-canvas px-4 pb-4 pt-4 sm:gap-4 sm:pt-10 max-lg:pb-[calc(1rem+var(--api-status-reserve,0px))]">
			<header>
				<AuthBrandLink href={marketingUrl} />
			</header>
			<main className="flex w-full max-w-md justify-center">{children}</main>
			<AuthBackHomeLink href={marketingUrl} />
		</div>
	);
}
