import {expect, test} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

test.describe('Dashboard shell navigation', () => {
	test('navigates from Dashboard to Patients', async ({page}) => {
		await signInAsPracticeAdmin(page);

		const sidebar = page.getByRole('complementary');
		await expect(sidebar.getByRole('navigation', {name: 'Primary'})).toBeVisible();
		await sidebar.getByRole('link', {name: 'Patients'}).click();

		await expect(page).toHaveURL(/\/dashboard\/patients$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Patients'})).toBeVisible();
		await expect(sidebar.getByRole('link', {name: 'Patients'})).toHaveAttribute('aria-current', 'page');
	});
});
