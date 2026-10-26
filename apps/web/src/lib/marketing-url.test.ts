import {getMarketingUrl} from '@/lib/marketing-url';

describe('getMarketingUrl', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('returns the normalized URL for an https origin', () => {
		vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', 'https://marketing.example.test');
		expect(getMarketingUrl()).toBe('https://marketing.example.test/');
	});

	it('accepts http for local development', () => {
		vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', 'http://localhost:3002');
		expect(getMarketingUrl()).toBe('http://localhost:3002/');
	});

	it.each(['', 'javascript:alert(1)', 'data:text/html,x', '/relative', 'not a url', 'ftp://example.test'])(
		'returns null for %j',
		(value) => {
			vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', value);
			expect(getMarketingUrl()).toBeNull();
		},
	);
});
