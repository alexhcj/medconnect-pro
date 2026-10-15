export interface MarketingNavItem {
	name: string;
	href: string;
}

export const MARKETING_NAV: readonly MarketingNavItem[] = [
	{name: 'Home', href: '/'},
	{name: 'Platform', href: '/platform'},
	{name: 'Security', href: '/security'},
	{name: 'About', href: '/about'},
	{name: 'Demo', href: '/demo'},
];

export function isMarketingNavItemActive(pathname: string, href: string): boolean {
	if (href === '/') {
		return pathname === '/';
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}
