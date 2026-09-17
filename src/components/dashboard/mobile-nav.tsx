'use client';

import {Dialog, DialogPanel, DialogTitle} from '@headlessui/react';
import {X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {NavLinks} from '@/components/dashboard/nav-links';
import type {DashboardNavItem} from '@/lib/navigation/dashboard-nav';

interface MobileNavProps {
	open: boolean;
	onClose: () => void;
	items: DashboardNavItem[];
}

export function MobileNav({open, onClose, items}: MobileNavProps) {
	return (
		<Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
			<div className="fixed inset-0 bg-black/25" aria-hidden />
			<div className="fixed inset-0 flex">
				<DialogPanel
					id="mobile-navigation"
					className="flex w-64 max-w-[80vw] flex-col bg-white shadow-lg"
				>
					<div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
						<DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
							<span
								className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white"
								aria-hidden
							>
								MC
							</span>
							MedConnect Pro
						</DialogTitle>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Close navigation"
							onClick={onClose}
						>
							<X className="h-5 w-5" aria-hidden />
						</Button>
					</div>
					<nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-6">
						<NavLinks items={items} onNavigate={onClose} />
					</nav>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
