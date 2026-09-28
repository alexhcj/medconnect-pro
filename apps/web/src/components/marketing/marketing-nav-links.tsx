'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {cn} from '@/lib/utils/utils';
import {isMarketingNavItemActive, type MarketingNavItem} from '@/lib/navigation/marketing-nav';

interface MarketingNavLinksProps {
	items: readonly MarketingNavItem[];
	orientation?: 'horizontal' | 'vertical';
}

export function MarketingNavLinks({
	items,
	orientation = 'horizontal',
}: MarketingNavLinksProps) {
	const pathname = usePathname();

	return (
		<ul
			className={cn(
				orientation === 'horizontal' ? 'flex items-center gap-1' : 'space-y-1',
			)}
		>
			{items.map((item) => {
				const isActive = isMarketingNavItemActive(pathname, item.href);
				return (
					<li key={item.href}>
						<Link
							href={item.href}
							aria-current={isActive ? 'page' : undefined}
							className={cn(
								'block rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
								isActive
									? 'bg-blue-50 text-blue-700'
									: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
							)}
						>
							{item.name}
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
