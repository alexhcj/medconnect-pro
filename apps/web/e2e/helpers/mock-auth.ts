import {expect, type Page} from '@playwright/test';

export const DEMO_EMAIL = 'practice.admin@example.test';
export const DEMO_PASSWORD = 'Demo-Admin-1';

export async function signInAsPracticeAdmin(page: Page) {
	await page.goto('/login');
	await page.getByLabel('Email').fill(DEMO_EMAIL);
	await page.getByLabel('Password').fill(DEMO_PASSWORD);
	await page.getByRole('button', {name: 'Sign in'}).click();
	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(page.getByRole('heading', {level: 1, name: 'Dashboard'})).toBeVisible();
}
