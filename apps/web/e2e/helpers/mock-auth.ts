import {expect, type Page} from '@playwright/test';

export const DEMO_EMAIL = 'practice.admin@example.test';
export const DEMO_PASSWORD = 'Demo-Admin-1';
export const NURSE_EMAIL = 'nurse@example.test';
export const NURSE_PASSWORD = 'Demo-Nurse-1';

export async function signInAsPracticeAdmin(page: Page) {
	await signIn(page, DEMO_EMAIL, DEMO_PASSWORD);
}

export async function signInAsNurse(page: Page) {
	await signIn(page, NURSE_EMAIL, NURSE_PASSWORD);
}

export async function signIn(page: Page, email: string, password: string) {
	await page.goto('/login');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', {name: 'Sign in'}).click();
	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(page.getByRole('heading', {level: 1, name: 'Dashboard'})).toBeVisible();
}
