'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LOGIN_PATH} from '@/lib/auth/paths';
import {isMarketingNavItemActive, MARKETING_NAV} from '@/lib/navigation/marketing-nav';
import {cn} from '@/lib/utils/utils';

export function MarketingFooterNav() {
	const pathname = usePathname();

	return (
		<nav aria-label="Footer">
			<ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
				{MARKETING_NAV.map((item) => {
					const isActive = isMarketingNavItemActive(pathname, item.href);
					return (
						<li key={item.href}>
							<Link
								href={item.href}
								aria-current={isActive ? 'page' : undefined}
								className={cn(
									'text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
									isActive
										? 'text-brand'
										: 'text-foreground-secondary hover:text-foreground',
								)}
							>
								{item.name}
							</Link>
						</li>
					);
				})}
				<li>
					<Link
						href={LOGIN_PATH}
						className="text-sm font-medium text-foreground-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						Sign in
					</Link>
				</li>
			</ul>
		</nav>
	);
}
