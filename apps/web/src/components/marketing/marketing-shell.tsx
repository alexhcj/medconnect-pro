'use client';

import {useEffect, useState} from 'react';
import {usePathname} from 'next/navigation';
import {MarketingFooter} from '@/components/marketing/marketing-footer';
import {MarketingHeader} from '@/components/marketing/marketing-header';
import {MarketingMobileNav} from '@/components/marketing/marketing-mobile-nav';

interface MarketingShellProps {
	children: React.ReactNode;
}

export function MarketingShell({children}: MarketingShellProps) {
	const pathname = usePathname();
	const [mobileNavOpen, setMobileNavOpen] = useState(false);

	useEffect(() => {
		setMobileNavOpen(false);
	}, [pathname]);

	return (
		<div className="flex min-h-screen flex-col bg-white">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-3 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-700 focus:shadow"
			>
				Skip to content
			</a>
			<MarketingHeader
				mobileNavOpen={mobileNavOpen}
				onOpenMobileNav={() => setMobileNavOpen(true)}
			/>
			<MarketingMobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
			<main id="main-content" className="flex-1" tabIndex={-1}>
				{children}
			</main>
			<MarketingFooter />
		</div>
	);
}
