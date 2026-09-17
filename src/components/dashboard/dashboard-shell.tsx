'use client';

import {useState} from 'react';
import {Header} from '@/components/dashboard/header';
import {MobileNav} from '@/components/dashboard/mobile-nav';
import {Sidebar} from '@/components/dashboard/sidebar';
import {useCurrentSession} from '@/lib/hooks/use-session';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {filterNavForRole, resolveNavRole} from '@/lib/navigation/dashboard-nav';

interface DashboardShellProps {
	children: React.ReactNode;
}

export function DashboardShell({children}: DashboardShellProps) {
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const {data: session} = useCurrentSession();
	const role = resolveNavRole(session?.userRole, {mockMode: isMockMode()});
	const items = filterNavForRole(role);

	return (
		<div className="min-h-screen bg-gray-50">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:m-3 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-700 focus:shadow"
			>
				Skip to content
			</a>
			<Sidebar items={items} />
			<MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} items={items} />
			<div className="lg:pl-64">
				<Header
					mobileNavOpen={mobileNavOpen}
					onOpenMobileNav={() => setMobileNavOpen(true)}
				/>
				<main id="main-content" className="p-4 sm:p-6 lg:p-8" tabIndex={-1}>
					{children}
				</main>
			</div>
		</div>
	);
}
