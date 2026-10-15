import {appLoginHref, appOrigin, absoluteMarketingUrl, siteUrl} from '@/lib/marketing/public-urls';

describe('public marketing URLs', () => {
	it('keeps sign-in on the application origin', () => {
		expect(siteUrl()).toBe('http://localhost:3002');
		expect(appOrigin()).toBe('http://localhost:3000');
		expect(appLoginHref()).toBe('http://localhost:3000/login');
		expect(new URL(appLoginHref()).origin).not.toBe(siteUrl());
	});

	it('builds a trailing-slash canonical on the marketing origin', () => {
		expect(absoluteMarketingUrl('/')).toBe('http://localhost:3002/');
		expect(absoluteMarketingUrl('/platform')).toBe('http://localhost:3002/platform/');
	});
});
