import {expect, test} from '@playwright/test';

test.describe('API status indicator in mock mode (FE-049)', () => {
	test('shows no indicator and sends no /health request on /login', async ({page}) => {
		const healthRequests: string[] = [];
		page.on('request', (request) => {
			if (new URL(request.url()).pathname.endsWith('/health')) {
				healthRequests.push(request.url());
			}
		});

		await page.goto('/login');
		await page.getByLabel('Email', {exact: true}).focus();
		await page.getByLabel('Password', {exact: true}).focus();
		await page.waitForTimeout(500);

		await expect(page.getByRole('button', {name: /api status/i})).toHaveCount(0);
		await expect(page.getByText('Server is waking up, see the status indicator')).toHaveCount(0);
		expect(healthRequests).toEqual([]);
	});

	test('keeps /login out of search engines', async ({page, request}) => {
		await page.goto('/login');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		const robots = await request.get('/robots.txt');
		expect(await robots.text()).toMatch(/Disallow: \/login/);
	});
});
