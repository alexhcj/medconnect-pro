import {expect, test} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

test.describe('Patient profile', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('opens a demographics-only profile from the patient list', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await page.getByRole('button', {name: 'Open navigation'}).click();
		await page.getByRole('dialog').getByRole('link', {name: 'Patients'}).click();

		await page.getByRole('link', {name: 'View profile for Avery Carter'}).click();

		await expect(page).toHaveURL(/\/dashboard\/patients\/demo-patient-001$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Avery Carter'})).toBeVisible();
		await expect(page.getByRole('navigation', {name: 'Profile sections'})).toBeVisible();
		await expect(page.getByRole('heading', {level: 2, name: 'Demographics'})).toBeVisible();
		await expect(page.getByText('patient001@example.test')).toBeVisible();
		await expect(page.getByText('+1-555-010-1000')).toBeVisible();
		await expect(page.getByText('Robin Carter')).toBeVisible();
		await expect(page.getByText('Demo Health Partners')).toBeVisible();
		await expect(page.getByText('Synthetic demo data. Not a real medical record.')).toBeVisible();

		await expect(page.getByRole('heading', {level: 2, name: 'History'})).toHaveCount(0);
		await expect(page.getByRole('heading', {level: 2, name: 'Vitals'})).toHaveCount(0);
		await expect(page.getByRole('heading', {level: 2, name: 'Medications'})).toHaveCount(0);
		await expect(page.getByRole('heading', {level: 2, name: 'Documents'})).toHaveCount(0);
		await expect(page.getByText('Hypertension')).toHaveCount(0);

		await page.getByRole('link', {name: 'Back to patients'}).click();
		await expect(page).toHaveURL(/\/dashboard\/patients$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Patients'})).toBeVisible();
	});
});
