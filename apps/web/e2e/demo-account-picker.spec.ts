import {expect, test} from '@playwright/test';
import {DEMO_EMAIL, DEMO_PASSWORD, PATIENT_EMAIL, PATIENT_PASSWORD} from './helpers/mock-auth';

// QA-013: browser coverage for the FE-059 demo account picker (flag set in playwright.config.ts).
test.describe('Demo account picker on /login', () => {
	test.beforeEach(async ({page}) => {
		await page.goto('/login');
	});

	test('one tap fills a Provider sign-in, focuses Sign in and reaches the dashboard', async ({page}) => {
		await page.getByRole('button', {name: 'Fill sign-in as Provider'}).click();

		await expect(page.getByRole('button', {name: 'Fill sign-in as Provider'})).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByText('Filled as Provider. Press Sign in.')).toBeVisible();
		await expect(page.getByLabel('Email', {exact: true})).not.toHaveValue('');
		await expect(page.getByLabel('Password', {exact: true})).not.toHaveValue('');
		await expect(page.getByRole('button', {name: 'Sign in'})).toBeFocused();

		await page.getByRole('button', {name: 'Sign in'}).click();
		await expect(page).toHaveURL(/\/dashboard$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Dashboard'})).toBeVisible();
	});

	test('one tap fills a Patient sign-in and reaches the dashboard', async ({page}) => {
		await page.getByRole('button', {name: 'Fill sign-in as Patient'}).click();

		await expect(page.getByLabel('Email', {exact: true})).toHaveValue(PATIENT_EMAIL);
		await expect(page.getByLabel('Password', {exact: true})).toHaveValue(PATIENT_PASSWORD);

		await page.getByRole('button', {name: 'Sign in'}).click();
		await expect(page).toHaveURL(/\/dashboard$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Dashboard'})).toBeVisible();
	});

	test('editing a filled field clears the selected role', async ({page}) => {
		const provider = page.getByRole('button', {name: 'Fill sign-in as Provider'});
		await provider.click();
		await expect(provider).toHaveAttribute('aria-pressed', 'true');

		await page.getByLabel('Email', {exact: true}).fill('someone.else@example.test');
		await expect(provider).toHaveAttribute('aria-pressed', 'false');
	});
});

test.describe('Demo account copy buttons', () => {
	test.use({permissions: ['clipboard-read', 'clipboard-write']});

	test('copying the email shows the visible Copied state and writes the clipboard', async ({page}) => {
		await page.goto('/login');
		const copy = page.getByRole('button', {name: 'Copy email for Practice admin'});
		await copy.click();

		await expect(copy).toContainText('Copied');
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(DEMO_EMAIL);
		await expect(copy).not.toContainText('Copied', {timeout: 5_000});
	});

	test('copying the password shows Copied and writes the clipboard', async ({page}) => {
		await page.goto('/login');
		const copy = page.getByRole('button', {name: 'Copy password for Practice admin'});
		await copy.click();

		await expect(copy).toContainText('Copied');
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(DEMO_PASSWORD);
	});
});
