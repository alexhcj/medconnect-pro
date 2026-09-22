import {expect, test} from '@playwright/test';
import {DEMO_EMAIL, signInAsPracticeAdmin} from './helpers/mock-auth';

test.describe('Mock authentication', () => {
	test('redirects unauthenticated dashboard visits to login', async ({page}) => {
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login/);
		await expect(page.getByRole('heading', {name: 'Sign in'})).toBeVisible();
	});

	test('signs in with the demo account and reaches the dashboard', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await expect(page.getByText(/signed in as practice_admin/i)).toBeVisible();
	});

	test('rejects invalid credentials', async ({page}) => {
		await page.goto('/login');
		await page.getByLabel('Email').fill(DEMO_EMAIL);
		await page.getByLabel('Password').fill('wrong-password');
		await page.getByRole('button', {name: 'Sign in'}).click();
		await expect(page.getByText('Invalid email or password.')).toBeVisible();
		await expect(page).toHaveURL(/\/login/);
	});

	test('signs out back to login', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await page.getByRole('button', {name: 'Sign out'}).click();
		await expect(page).toHaveURL(/\/login/);
		await page.goto('/dashboard');
		await expect(page).toHaveURL(/\/login/);
	});
});
