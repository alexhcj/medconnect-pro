import {expect, test} from '@playwright/test';
import {MFA_NURSE_CODE, MFA_NURSE_EMAIL, MFA_NURSE_PASSWORD} from './helpers/mock-auth';

test.describe('Live mock MFA challenge', () => {
	test('verifies the fixture code and reaches the dashboard without storing tokens', async ({
		page,
		context,
	}) => {
		await page.goto('/login');
		await page.getByLabel('Email').fill(MFA_NURSE_EMAIL);
		await page.getByLabel('Password').fill(MFA_NURSE_PASSWORD);
		await page.getByRole('button', {name: 'Sign in'}).click();

		await expect(page.getByRole('heading', {name: 'Verify mock MFA'})).toBeVisible();
		await expect(page.getByLabel('Verification code')).toBeFocused();
		await page.getByLabel('Verification code').fill(MFA_NURSE_CODE);
		await page.getByRole('button', {name: 'Verify'}).click();

		await expect(page).toHaveURL(/\/dashboard$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Dashboard'})).toBeVisible();

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
	});
});
