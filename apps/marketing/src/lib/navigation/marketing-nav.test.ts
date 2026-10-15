import {isMarketingNavItemActive, MARKETING_NAV} from '@/lib/navigation/marketing-nav';

describe('MARKETING_NAV', () => {
	it('lists the public marketing placeholder routes', () => {
		expect(MARKETING_NAV.map((item) => item.href)).toEqual([
			'/',
			'/platform',
			'/security',
			'/about',
			'/demo',
		]);
	});
});

describe('isMarketingNavItemActive', () => {
	it('marks Home current only on the root path', () => {
		expect(isMarketingNavItemActive('/', '/')).toBe(true);
		expect(isMarketingNavItemActive('/platform', '/')).toBe(false);
	});

	it('marks nested paths under a section as current', () => {
		expect(isMarketingNavItemActive('/platform', '/platform')).toBe(true);
		expect(isMarketingNavItemActive('/platform/patient-management', '/platform')).toBe(true);
	});
});
