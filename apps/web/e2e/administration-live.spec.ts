import {expect, test, type Page} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

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
		await expect(page.getByText('Synthetic demo. User roles are presentation only.')).toBeVisible();

		const users = page.getByRole('list', {name: 'Practice users'});
		await expect(users).toContainText('practice.admin@example.test');
		await expect(users).toContainText('PRACTICE_ADMIN');
		await expect(users).toContainText('jordan.ellis@synthetic.example');
		await expect(users).toContainText('PROVIDER');
		await expect(users).not.toContainText('provider@example.test');
		await expect(users).not.toContainText('user_mock_');
		await expect(users).not.toContainText('demo-practice-001');

		const events = page.getByRole('list', {name: 'Audit events'});
		await expect(events).toContainText('auth.login.succeeded');
		await expect(events).not.toContainText('user_mock_practice_admin');
	});
});
