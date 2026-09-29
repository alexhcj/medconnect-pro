'use client';

import Link from 'next/link';
import {Menu} from 'lucide-react';
import {Button, buttonVariants} from '@/components/ui/button';
import {LOGIN_PATH} from '@/lib/auth/paths';
import {MARKETING_NAV} from '@/lib/navigation/marketing-nav';
import {cn} from '@/lib/utils/utils';
import {MarketingNavLinks} from '@/components/marketing/marketing-nav-links';

interface MarketingHeaderProps {
	onOpenMobileNav: () => void;
	mobileNavOpen: boolean;
}

export function MarketingHeader({onOpenMobileNav, mobileNavOpen}: MarketingHeaderProps) {
	return (
		<header className="border-b border-border bg-surface">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
				<Link
					href="/"
					className="flex items-center gap-2 rounded-md text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<span
						className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-inverse"
						aria-hidden
					>
						MC
					</span>
					<span className="text-lg font-semibold">MedConnect Pro</span>
				</Link>
				<nav aria-label="Primary" className="hidden lg:block">
					<MarketingNavLinks items={MARKETING_NAV} />
				</nav>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="lg:hidden"
						aria-label="Open navigation"
						aria-expanded={mobileNavOpen}
						aria-controls="marketing-mobile-navigation"
						onClick={onOpenMobileNav}
					>
						<Menu className="h-5 w-5" aria-hidden />
					</Button>
					<Link
						href={LOGIN_PATH}
						className={cn(buttonVariants({variant: 'default', size: 'sm'}))}
					>
						Sign in
					</Link>
				</div>
			</div>
		</header>
	);
}
