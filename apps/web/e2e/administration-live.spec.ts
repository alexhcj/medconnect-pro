import {expect, test, type Page} from '@playwright/test';
import {LIVE_PROVIDER_EMAIL} from './helpers/mock-auth';
import {ADMIN_STATE, openDashboard} from './helpers/live-session';
import {chooseSelectOption, selectField} from './helpers/select-fields';

async function openAdministration(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Administration'}).click();
	await expect(page).toHaveURL(/\/dashboard\/admin$/);
}

// Lists are paged (25 per page, 28 seeded users), so each assertion narrows the list through the
// same URL params the filters write instead of assuming page 1 holds the row.
const USERS = '/dashboard/admin?usersQ=';
const AUDIT_LOGIN = 'auditAction=auth.login.succeeded';
const SECURITY_LOGIN = 'securityAction=auth.login.succeeded';

test.describe('Live administration users and audit', () => {
	test.use({storageState: ADMIN_STATE});
	test.use({viewport: {width: 768, height: 1024}});

	test('shows seeded practice users and a login audit action', async ({page}) => {
		await openDashboard(page);
		await openAdministration(page);

		await expect(page.getByRole('heading', {level: 1, name: 'Administration'})).toBeVisible();
		await expect(
			page.getByText(
				'Synthetic demo. Role changes apply to this practice only. Nest enforces grant limits.',
			),
		).toBeVisible();

		await page.goto(`${USERS}practice.admin`);
		const users = page.getByRole('table', {name: 'Practice users'});
		await expect(users).toContainText('practice.admin@example.test');
		await expect(users).toContainText('PRACTICE_ADMIN');
		await expect(users).not.toContainText('user_mock_');
		await expect(users).not.toContainText('demo-practice-001');

		await page.goto(`${USERS}${LIVE_PROVIDER_EMAIL}`);
		await expect(users).toContainText(LIVE_PROVIDER_EMAIL);
		await expect(selectField(page, `Role for ${LIVE_PROVIDER_EMAIL}`)).toHaveText('PROVIDER');

		await page.goto(`/dashboard/admin?${AUDIT_LOGIN}&${SECURITY_LOGIN}`);
		const events = page.getByRole('table', {name: 'Audit events'});
		await expect(events).toContainText('auth.login.succeeded');
		await expect(events).not.toContainText('user_mock_practice_admin');

		const security = page.getByRole('table', {name: 'Security events'});
		await expect(security).toContainText('auth.login.succeeded');
		await expect(security).not.toContainText('user_mock_');
		await expect(security).not.toContainText('patient.accessed');
	});

	test('practice admin changes the seeded provider role and restores it', async ({page}) => {
		await page.goto(`${USERS}${LIVE_PROVIDER_EMAIL}`);

		const label = `Role for ${LIVE_PROVIDER_EMAIL}`;
		const select = selectField(page, label);
		await expect(select).toHaveText('PROVIDER');

		try {
			await chooseSelectOption(page, label, 'NURSE');
			await expect(page.getByRole('status').filter({hasText: 'Role updated'})).toBeVisible();
		} finally {
			await expect(select).toBeEnabled();
			await chooseSelectOption(page, label, 'PROVIDER');
		}
	});
});
