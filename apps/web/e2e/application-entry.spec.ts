import {expect, test} from '@playwright/test';

test('application entry redirects to sign-in', async ({page}) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole('heading', {level: 1, name: 'Sign in'})).toBeVisible();
});
