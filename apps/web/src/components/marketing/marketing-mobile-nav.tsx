'use client';

import {Dialog, DialogPanel, DialogTitle} from '@headlessui/react';
import {X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {MARKETING_NAV} from '@/lib/navigation/marketing-nav';
import {MarketingNavLinks} from '@/components/marketing/marketing-nav-links';

interface MarketingMobileNavProps {
	open: boolean;
	onClose: () => void;
}

export function MarketingMobileNav({open, onClose}: MarketingMobileNavProps) {
	return (
		<Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
			<div className="fixed inset-0 bg-overlay" aria-hidden />
			<div className="fixed inset-0 flex justify-end">
				<DialogPanel
					id="marketing-mobile-navigation"
					className="flex w-72 max-w-[80vw] flex-col bg-surface shadow-lg"
				>
					<div className="flex h-16 items-center justify-between border-b border-border px-4">
						<DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
							<span
								className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-inverse"
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
						<MarketingNavLinks items={MARKETING_NAV} orientation="vertical" />
					</nav>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
