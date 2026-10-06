import {expect, test} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

test.describe('Live cookie session', () => {
	test('signs in to the dashboard without storing access or refresh tokens', async ({page, context}) => {
		await signInAsPracticeAdmin(page);

		const storage = await page.evaluate(() => ({
			authToken: window.localStorage.getItem('auth_token'),
			refresh: window.localStorage.getItem('mcp_live_refresh'),
			session: window.localStorage.getItem('mcp_live_session'),
		}));
		expect(storage.authToken).toBeNull();
		expect(storage.refresh).toBeNull();
		expect(storage.session).toBeTruthy();

		const cookies = await context.cookies();
		expect(cookies.some((cookie) => cookie.name === 'mcp_access')).toBe(true);

		await page.getByRole('button', {name: 'Sign out'}).click();
		await expect(page).toHaveURL(/\/login/);
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login/);
	});
});
