import {expect, test} from '@playwright/test';

test.describe('Live OAuth sign-in (Fake OIDC adapter)', () => {
	test('round-trips through Nest, hydrates the session, and recovers after reload', async ({page, context}) => {
		await page.goto('/login');
		await page.getByRole('button', {name: /continue with/i}).click();

		await expect(page).toHaveURL(/\/dashboard/);

		const cookies = await context.cookies();
		expect(cookies.some((cookie) => cookie.name === 'mcp_access')).toBe(true);

		const stored = await page.evaluate(() =>
			Object.keys(window.localStorage).map((key) => window.localStorage.getItem(key) ?? ''),
		);
		expect(stored.join('')).not.toMatch(/token/i);

		await page.evaluate(() => window.localStorage.removeItem('mcp_live_session'));
		await page.reload();
		await expect(page).toHaveURL(/\/dashboard/);

		await page.getByRole('button', {name: 'Sign out'}).click();
		await expect(page).toHaveURL(/\/login/);
		expect(await page.evaluate(() => window.localStorage.getItem('mcp_live_session'))).toBeNull();
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login/);
	});

	test('shows a generic error when the callback fails', async ({page}) => {
		await page.goto('http://localhost:3001/auth/oauth/fake/callback?code=bad&state=bad');
		await expect(page).toHaveURL(/\/login\?reason=oauth_failed/);
		await expect(page.getByRole('alert')).toHaveText(/couldn't sign you in with that provider/i);
	});
});
