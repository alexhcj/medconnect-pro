import {expect, test} from '@playwright/test';
import {openDashboard, PROVIDER_STATE} from './helpers/live-session';

test.describe('Live clinical profile lists', () => {
	test.use({storageState: PROVIDER_STATE});
	test.use({viewport: {width: 768, height: 1024}});

	test('shows seeded history, conditions, vitals, medications, and documents for the live provider', async ({
		page,
	}) => {
		await openDashboard(page);
		await page.goto('/dashboard/patients?patientsQ=Avery');

		await page.getByRole('link', {name: 'View profile for Avery Quinn'}).click();
		await expect(page).toHaveURL(/\/dashboard\/patients\/[0-9a-f-]{36}$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Avery Quinn'})).toBeVisible();

		await expect(page.getByRole('heading', {level: 2, name: 'History'})).toBeVisible();
		await expect(page.getByRole('list', {name: 'History'})).toContainText('Hypertension follow-up');

		await expect(page.getByRole('heading', {level: 2, name: 'Conditions'})).toBeVisible();
		await expect(page.getByRole('list', {name: 'Conditions'})).toContainText('Hypertension');
		await expect(page.getByRole('list', {name: 'Conditions'})).toContainText('active');

		await expect(page.getByRole('heading', {level: 2, name: 'Vitals'})).toBeVisible();
		await expect(page.getByRole('list', {name: 'Vitals'})).toContainText('Blood pressure 128/82 mmHg');

		await expect(page.getByRole('heading', {level: 2, name: 'Medications'})).toBeVisible();
		await expect(page.getByRole('list', {name: 'Medications'})).toContainText('Lisinopril');

		await expect(page.getByRole('heading', {level: 2, name: 'Documents'})).toBeVisible();
		await expect(page.getByRole('list', {name: 'Documents'})).toContainText('Intake summary.pdf');
		await expect(page.getByRole('button', {name: 'Download Intake summary.pdf'})).toBeVisible();
	});
});
