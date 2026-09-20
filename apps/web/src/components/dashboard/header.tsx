'use client';

import {Bell, Menu, User} from 'lucide-react';
import {Button} from '@/components/ui/button';

interface HeaderProps {
	onOpenMobileNav: () => void;
	mobileNavOpen: boolean;
}

export function Header({onOpenMobileNav, mobileNavOpen}: HeaderProps) {
	return (
		<header className="border-b border-gray-200 bg-white shadow-sm">
			<div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="lg:hidden"
					aria-label="Open navigation"
					aria-expanded={mobileNavOpen}
					aria-controls="mobile-navigation"
					onClick={onOpenMobileNav}
				>
					<Menu className="h-5 w-5" aria-hidden />
				</Button>
				<div className="hidden lg:block" />
				<div className="ml-auto flex items-center gap-2">
					<Button type="button" variant="ghost" size="icon" aria-label="Notifications">
						<Bell className="h-5 w-5" aria-hidden />
					</Button>
					<Button type="button" variant="ghost" size="icon" aria-label="Account">
						<User className="h-5 w-5" aria-hidden />
					</Button>
				</div>
			</div>
		</header>
	);
}
