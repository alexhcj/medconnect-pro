import {expect, test, type Page} from '@playwright/test';
import {signInAsLiveProvider} from './helpers/mock-auth';

async function openPatients(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Patients'}).click();
	await expect(page).toHaveURL(/\/dashboard\/patients$/);
}

test.describe('Live clinical profile lists', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('shows seeded history, conditions, vitals, and medications for the live provider', async ({
		page,
	}) => {
		await signInAsLiveProvider(page);
		await openPatients(page);

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

		await expect(page.getByRole('heading', {level: 2, name: 'Documents'})).toHaveCount(0);
	});
});
