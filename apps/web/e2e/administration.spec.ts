import {expect, test, type Page} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

async function openAdministration(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Administration'}).click();
	await expect(page).toHaveURL(/\/dashboard\/admin$/);
}

test.describe('Administration', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('lists synthetic users and audit events', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openAdministration(page);

		await expect(page.getByRole('heading', {level: 1, name: 'Administration'})).toBeVisible();
		await expect(
			page.getByText(
				'Synthetic demo. Role changes apply to this practice only. Nest enforces grant limits.',
			),
		).toBeVisible();

		const users = page.getByRole('table', {name: 'Practice users'});
		await expect(users).toContainText('practice.admin@example.test');
		await expect(users).toContainText('PRACTICE_ADMIN');
		await expect(users).toContainText('provider@example.test');
		await expect(
			page.getByRole('combobox', {name: 'Role for provider@example.test'}),
		).toHaveValue('PROVIDER');

		const events = page.getByRole('table', {name: 'Audit events'});
		await expect(events).toContainText('auth.login.succeeded');
		await expect(events).toContainText('patient.accessed');
		await expect(events).toContainText('access.denied');
		await expect(events).toContainText('user_mock_practice_admin');

		const security = page.getByRole('table', {name: 'Security events'});
		await expect(security).toContainText('auth.login.succeeded');
		await expect(security).toContainText('auth.login.failed');
		await expect(security).toContainText('auth.mfa.succeeded');
		await expect(security).toContainText('auth.logout');
		await expect(security).not.toContainText('patient.accessed');
		await expect(security).toContainText('user_mock_practice_admin');
	});

	test('pages audit events, keeps the page in the URL and resets on filter change', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openAdministration(page);

		const events = page.getByRole('table', {name: 'Audit events'});
		await expect(events).toBeVisible();
		await expect(page.getByText(/Showing 1–25 of \d+ events · newest first/).first()).toBeVisible();
		await expect(events.getByRole('row')).toHaveCount(26);

		const pagination = page.getByRole('navigation', {name: 'Audit events pagination'});
		await pagination.getByRole('button', {name: 'Next page'}).click();
		await expect(page).toHaveURL(/auditPage=2/);
		await expect(page.getByText(/Showing 26–50 of \d+ events/)).toBeVisible();

		await page.reload();
		await expect(page.getByText(/Showing 26–50 of \d+ events/)).toBeVisible();

		await page.getByRole('combobox', {name: 'Action'}).first().selectOption('patient.accessed');
		await expect(page).toHaveURL(/auditAction=patient\.accessed/);
		await expect(page).not.toHaveURL(/auditPage=/);
		await expect(page.getByText(/Showing 1–\d+ of \d+ events/).first()).toBeVisible();
	});

	test('searches users and shows the filtered total', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openAdministration(page);

		await page.getByRole('searchbox', {name: 'Search users'}).fill('demo.user.00');
		await page.getByRole('searchbox', {name: 'Search users'}).press('Enter');
		await expect(page).toHaveURL(/usersQ=demo\.user\.00/);
		await expect(page.getByText(/Showing 1–9 of 9 users/)).toBeVisible();
	});
});

test.describe('Administration at 320 px', () => {
	test.use({viewport: {width: 320, height: 800}});

	test('stacks rows without horizontal scroll', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await page.getByRole('button', {name: 'Open navigation'}).click();
		await page.getByRole('dialog').getByRole('link', {name: 'Administration'}).click();
		await expect(page.getByRole('table', {name: 'Audit events'})).toBeVisible();

		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(0);
		await expect(page.getByText(/Page 1 of \d+/).first()).toBeVisible();
	});
});
