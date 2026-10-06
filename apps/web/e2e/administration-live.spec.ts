import {expect, test, type Page} from '@playwright/test';
import {LIVE_PROVIDER_EMAIL, signInAsPracticeAdmin} from './helpers/mock-auth';

async function openAdministration(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Administration'}).click();
	await expect(page).toHaveURL(/\/dashboard\/admin$/);
}

test.describe('Live administration users and audit', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('shows seeded practice users and a login audit action', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openAdministration(page);

		await expect(page.getByRole('heading', {level: 1, name: 'Administration'})).toBeVisible();
		await expect(
			page.getByText(
				'Synthetic demo. Role changes apply to this practice only. Nest enforces grant limits.',
			),
		).toBeVisible();

		const users = page.getByRole('list', {name: 'Practice users'});
		await expect(users).toContainText('practice.admin@example.test');
		await expect(users).toContainText('PRACTICE_ADMIN');
		await expect(users).toContainText(LIVE_PROVIDER_EMAIL);
		await expect(
			page.getByRole('combobox', {name: `Role for ${LIVE_PROVIDER_EMAIL}`}),
		).toHaveValue('PROVIDER');
		await expect(users).not.toContainText('provider@example.test');
		await expect(users).not.toContainText('user_mock_');
		await expect(users).not.toContainText('demo-practice-001');

		const events = page.getByRole('list', {name: 'Audit events'});
		await expect(events).toContainText('auth.login.succeeded');
		await expect(events).not.toContainText('user_mock_practice_admin');
	});

	test('practice admin changes the seeded provider role and restores it', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openAdministration(page);

		const select = page.getByRole('combobox', {name: `Role for ${LIVE_PROVIDER_EMAIL}`});
		await expect(select).toHaveValue('PROVIDER');

		try {
			await select.selectOption('NURSE');
			await expect(select).toHaveValue('NURSE');
			await expect(page.getByRole('status', {name: 'Role updated'})).toBeVisible();
		} finally {
			await select.selectOption('PROVIDER');
			await expect(select).toHaveValue('PROVIDER');
		}
	});
});
