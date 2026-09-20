'use client';

import {NavLinks} from '@/components/dashboard/nav-links';
import type {DashboardNavItem} from '@/lib/navigation/dashboard-nav';

interface SidebarProps {
	items: DashboardNavItem[];
}

export function Sidebar({items}: SidebarProps) {
	return (
		<aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
			<div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600" aria-hidden>
					<span className="text-sm font-bold text-white">MC</span>
				</div>
				<span className="text-xl font-semibold text-gray-900">MedConnect Pro</span>
			</div>
			<nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-6">
				<NavLinks items={items} />
			</nav>
		</aside>
	);
}
