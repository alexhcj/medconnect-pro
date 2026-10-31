import {expect, test, type Page} from '@playwright/test';
import {fillDateField} from './helpers/date-fields';
import {chooseSelectOption} from './helpers/select-fields';
import {ADMIN_STATE, openDashboard} from './helpers/live-session';

async function openPatients(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Patients'}).click();
	await expect(page).toHaveURL(/\/dashboard\/patients$/);
}

test.describe('Live patient list and create', () => {
	test.use({storageState: ADMIN_STATE});
	test.use({viewport: {width: 768, height: 1024}});

	test('shows seeded patients and creates another synthetic patient', async ({page}) => {
		await openDashboard(page);
		await openPatients(page);

		// The list pages 10 at a time and each run adds a patient, so search instead of assuming page 1.
		await page.goto('/dashboard/patients?patientsQ=Avery');
		await expect(page.getByText('Avery Quinn')).toBeVisible();

		await page.getByRole('link', {name: 'Add patient'}).click();
		await expect(page).toHaveURL(/\/dashboard\/patients\/new$/);

		const suffix = Date.now().toString().slice(-6);
		await page.getByLabel('First name').fill('Quinn');
		await page.getByLabel('Last name').fill(`Harlow${suffix}`);
		await fillDateField(page, 'Date of birth', '1991-03-04');
		await chooseSelectOption(page, 'Gender', 'Non-binary');
		await page.getByLabel('Phone', {exact: true}).fill('555-0142');
		await page.getByLabel('Email').fill(`quinn.harlow.${suffix}@synthetic.example`);
		await page.getByLabel('Street').fill('42 Demo Lane');
		await page.getByLabel('City').fill('Springfield');
		await page.getByLabel('State').fill('IL');
		await page.getByLabel('Postal code').fill('62704');
		await page.getByLabel('Emergency contact name').fill('Alex Harlow');
		await page.getByLabel('Relationship').fill('Sibling');
		await page.getByLabel('Emergency phone').fill('555-0143');
		await page.getByLabel('Insurance provider').fill('Demo Health Partners');
		await page.getByLabel('Policy number').fill(`DEM-${suffix}`);
		await page.getByLabel('Group number').fill('GRP-DEMO');
		await chooseSelectOption(page, 'Assigned provider', 'Dr. Jordan Ellis');
		await page.getByRole('button', {name: 'Create patient'}).click();

		await expect(page).toHaveURL(/\/dashboard\/patients\/[0-9a-f-]{36}$/);
		await expect(page.getByRole('heading', {level: 1, name: `Quinn Harlow${suffix}`})).toBeVisible();
		await expect(page.getByRole('link', {name: 'History'})).toHaveCount(0);

		await page.goto(`/dashboard/patients?patientsQ=Harlow${suffix}`);
		await expect(page.getByRole('list', {name: 'Patients'}).getByText(`Quinn Harlow${suffix}`)).toBeVisible();
	});
});
