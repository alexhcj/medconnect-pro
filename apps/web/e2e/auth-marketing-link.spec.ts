import {expect, test} from '@playwright/test';

const MARKETING = 'http://localhost:3002/';
const BRAND = {name: 'MedConnect Pro, back to home'};

test.describe('Auth pages marketing link (FE-050)', () => {
	for (const path of ['/login', '/register', '/email-verification']) {
		test(`${path} links the logo and back link to marketing`, async ({page}) => {
			await page.goto(path);
			await expect(page.getByRole('link', BRAND)).toHaveAttribute('href', MARKETING);
			await expect(page.getByRole('link', {name: 'Back to home', exact: true})).toHaveAttribute(
				'href',
				MARKETING,
			);
		});
	}

	test('a direct /login visitor reaches marketing in the same tab', async ({page}) => {
		await page.route(`${MARKETING}**`, (route) =>
			route.fulfill({contentType: 'text/html', body: '<h1>Marketing</h1>'}),
		);
		await page.goto('/login');
		await page.getByRole('link', BRAND).click();
		await expect(page).toHaveURL(MARKETING);
	});

	test('the OAuth landing shows no brand header', async ({page}) => {
		await page.goto('/login/oauth/complete');
		await expect(page.getByRole('link', BRAND)).toHaveCount(0);
	});

	for (const width of [320, 375, 768, 1024]) {
		test(`/login has no horizontal scroll and a usable form at ${width}px`, async ({page}) => {
			await page.setViewportSize({width, height: 700});
			await page.goto('/login');
			await expect(page.getByRole('link', BRAND)).toBeVisible();
			await expect(page.getByRole('button', {name: 'Sign in'})).toBeVisible();
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
			);
			expect(overflow).toBeLessThanOrEqual(0);
			const box = await page.getByRole('link', BRAND).boundingBox();
			expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
		});
	}
});
