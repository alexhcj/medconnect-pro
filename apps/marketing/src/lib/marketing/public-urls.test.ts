import {
	apiOrigin,
	appLoginHref,
	appOrigin,
	absoluteMarketingUrl,
	siteUrl,
} from '@/lib/marketing/public-urls';

describe('public marketing URLs', () => {
	it('keeps sign-in on the application origin', () => {
		expect(siteUrl()).toBe('http://localhost:3002');
		expect(appOrigin()).toBe('http://localhost:3000');
		expect(appLoginHref()).toBe('http://localhost:3000/login');
		expect(new URL(appLoginHref()).origin).not.toBe(siteUrl());
	});

	it('has no API origin unless configured, and accepts only an origin', () => {
		vi.stubEnv('NEXT_PUBLIC_API_ORIGIN', '');
		expect(apiOrigin()).toBeNull();
		vi.stubEnv('NEXT_PUBLIC_API_ORIGIN', 'https://api.example.test/');
		expect(apiOrigin()).toBe('https://api.example.test');
		vi.stubEnv('NEXT_PUBLIC_API_ORIGIN', 'https://api.example.test/path');
		expect(() => apiOrigin()).not.toThrow();
		vi.stubEnv('NEXT_PUBLIC_API_ORIGIN', 'ftp://api.example.test');
		expect(() => apiOrigin()).toThrow();
		vi.unstubAllEnvs();
	});

	it('builds a trailing-slash canonical on the marketing origin', () => {
		expect(absoluteMarketingUrl('/')).toBe('http://localhost:3002/');
		expect(absoluteMarketingUrl('/platform')).toBe('http://localhost:3002/platform/');
	});
});
