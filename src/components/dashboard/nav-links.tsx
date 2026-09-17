'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {cn} from '@/lib/utils/utils';
import {isNavItemActive, type DashboardNavItem} from '@/lib/navigation/dashboard-nav';

interface NavLinksProps {
	items: DashboardNavItem[];
	onNavigate?: () => void;
}

export function NavLinks({items, onNavigate}: NavLinksProps) {
	const pathname = usePathname();

	return (
		<ul className="space-y-1">
			{items.map((item) => {
				const isActive = isNavItemActive(pathname, item.href);
				const Icon = item.icon;
				return (
					<li key={item.href}>
						<Link
							href={item.href}
							onClick={onNavigate}
							aria-current={isActive ? 'page' : undefined}
							className={cn(
								'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
								isActive
									? 'border-r-2 border-blue-600 bg-blue-50 text-blue-700'
									: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
							)}
						>
							<Icon
								className={cn('mr-3 h-5 w-5', isActive ? 'text-blue-500' : 'text-gray-400')}
								aria-hidden
							/>
							{item.name}
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
