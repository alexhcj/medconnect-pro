import {expect, test} from '@playwright/test';

test.describe('Marketing public navigation', () => {
	test('navigates placeholder pages and the existing mock login', async ({page}) => {
		await page.goto('/');

		const primaryNav = page.getByRole('navigation', {name: 'Primary'});
		await expect(page.getByRole('heading', {level: 1, name: 'MedConnect Pro'})).toBeVisible();
		await expect(page).toHaveTitle(/Home/);
		await expect(page.getByRole('banner')).toBeVisible();
		await expect(primaryNav).toBeVisible();
		await expect(page.getByRole('contentinfo')).toBeVisible();

		await primaryNav.getByRole('link', {name: 'Platform'}).click();
		await expect(page).toHaveURL(/\/platform$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Platform'})).toBeVisible();
		await expect(page).toHaveTitle(/Platform/);

		await primaryNav.getByRole('link', {name: 'Security'}).click();
		await expect(page).toHaveURL(/\/security$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Security'})).toBeVisible();
		await expect(page).toHaveTitle(/Security/);

		await primaryNav.getByRole('link', {name: 'About'}).click();
		await expect(page).toHaveURL(/\/about$/);
		await expect(page.getByRole('heading', {level: 1, name: 'About'})).toBeVisible();
		await expect(page).toHaveTitle(/About/);

		await primaryNav.getByRole('link', {name: 'Demo'}).click();
		await expect(page).toHaveURL(/\/demo$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Explore the demo'})).toBeVisible();
		await expect(page).toHaveTitle(/Demo/);

		await page.getByRole('link', {name: 'Sign in to the demo'}).click();
		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Sign in'})).toBeVisible();
		await expect(page.getByRole('note')).toContainText('mock identity provider');
	});
});
