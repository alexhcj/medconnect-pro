import {expect, test, type Page} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

async function openAppointments(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Appointments'}).click();
	await expect(page).toHaveURL(/\/dashboard\/appointments$/);
}

test.describe('Appointment calendar', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('renders day, week, and month views and opens an appointment', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openAppointments(page);

		await expect(page.getByRole('heading', {level: 1, name: 'Appointments'})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Calendar'})).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByRole('button', {name: 'Week view'})).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByRole('region', {name: 'Appointment calendar'})).toBeVisible();

		await page.getByRole('button', {name: 'Month view'}).click();
		await expect(page.getByRole('button', {name: 'Month view'})).toHaveAttribute('aria-pressed', 'true');

		await page.getByRole('button', {name: 'Day view'}).click();
		await expect(page.getByRole('button', {name: 'Day view'})).toHaveAttribute('aria-pressed', 'true');

		await page.getByRole('button', {name: 'Week view'}).click();
		await expect(page.getByRole('button', {name: 'Week view'})).toHaveAttribute('aria-pressed', 'true');

		await page.getByRole('button', {name: /Avery Carter · Dr\. Jordan Ellis · Scheduled/}).click();
		const dialog = page.getByRole('dialog', {name: 'Appointment'});
		await expect(dialog).toBeVisible();
		await expect(dialog).toContainText('Avery Carter');
		await expect(dialog).toContainText('Dr. Jordan Ellis');
		await expect(dialog).toContainText('Office visit');
		await expect(dialog).toContainText('Scheduled');
		await expect(dialog.getByRole('link', {name: 'View patient profile'})).toBeVisible();

		await page.getByRole('button', {name: 'Close'}).click();
		await expect(dialog).toHaveCount(0);

		await page.getByRole('button', {name: 'List'}).click();
		await expect(page.getByRole('list', {name: 'Appointments'})).toBeVisible();
	});
});
