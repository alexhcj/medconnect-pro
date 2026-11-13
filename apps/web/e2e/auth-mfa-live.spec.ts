import {expect, test} from '@playwright/test';
import {MFA_NURSE_CODE, MFA_NURSE_EMAIL, MFA_NURSE_PASSWORD} from './helpers/mock-auth';

test.describe('Live mock MFA challenge', () => {
	test('verifies the fixture code and reaches the dashboard without storing tokens', async ({
		page,
		context,
	}) => {
		await page.goto('/login');
		await page.getByLabel('Email', {exact: true}).fill(MFA_NURSE_EMAIL);
		await page.getByLabel('Password', {exact: true}).fill(MFA_NURSE_PASSWORD);
		await page.getByRole('button', {name: 'Sign in'}).click();

		await expect(page.getByRole('heading', {name: 'Verify mock MFA'})).toBeVisible();
		await expect(page.getByLabel('Verification code')).toBeFocused();
		// QA-013: "Fill code" (demo flag) fills the fixture code and moves focus to Verify.
		await page.getByRole('button', {name: 'Fill code'}).click();
		await expect(page.getByLabel('Verification code')).toHaveValue(MFA_NURSE_CODE);
		await expect(page.getByRole('button', {name: 'Verify'})).toBeFocused();
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

		// QA-015: this sign-in is the MFA nurse's second session once `setup` signs the same account in
		// for the telehealth spec, and two sessions open the "Multiple Sessions Detected" modal, which
		// blocks the nurse's lobby click. End this session so `setup` holds the only one.
		await page.getByRole('button', {name: 'Sign out'}).click();
		await expect(page).toHaveURL(/\/login/);
	});
});
