import {expect, test, type Page} from '@playwright/test';
import {signIn, signInAsPracticeAdmin} from './helpers/mock-auth';

async function openPatients(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Patients'}).click();
	await expect(page).toHaveURL(/\/dashboard\/patients$/);
}

async function fillNewPatient(page: Page) {
	await page.getByLabel('First name').fill('Quinn');
	await page.getByLabel('Last name').fill('Harlow');
	await page.getByLabel('Date of birth').fill('1991-03-04');
	await page.getByLabel('Gender').selectOption('non-binary');
	await page.getByLabel('Phone', {exact: true}).fill('+1-555-010-4242');
	await page.getByLabel('Email').fill('quinn.harlow@example.test');
	await page.getByLabel('Street').fill('42 Demo Lane');
	await page.getByLabel('City').fill('Springfield');
	await page.getByLabel('State').fill('IL');
	await page.getByLabel('Postal code').fill('62704');
	await page.getByLabel('Emergency contact name').fill('Alex Harlow');
	await page.getByLabel('Relationship').fill('Sibling');
	await page.getByLabel('Emergency phone').fill('+1-555-010-4243');
	await page.getByLabel('Insurance provider').fill('Demo Health Partners');
	await page.getByLabel('Policy number').fill('DEM-424242');
	await page.getByLabel('Group number').fill('GRP-DEMO-42');
	await page.getByLabel('Assigned provider').selectOption('demo-provider-001');
}

test.describe('Patient create and edit', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('blocks an empty create, then saves and edits a patient', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openPatients(page);
		await page.getByRole('link', {name: 'Add patient'}).click();

		await expect(page).toHaveURL(/\/dashboard\/patients\/new$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Add patient'})).toBeVisible();
		await page.getByRole('button', {name: 'Create patient'}).click();
		await expect(page.getByText('First name is required')).toBeVisible();
		await expect(page).toHaveURL(/\/dashboard\/patients\/new$/);

		await fillNewPatient(page);
		await page.getByRole('button', {name: 'Create patient'}).click();

		await expect(page).toHaveURL(/\/dashboard\/patients\/demo-patient-021$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Quinn Harlow'})).toBeVisible();
		await expect(page.getByText('+1-555-010-4242')).toBeVisible();
		await expect(page.getByText('Synthetic demo data. Not a real medical record.')).toBeVisible();

		await page.getByRole('link', {name: 'Edit patient'}).click();
		await expect(page).toHaveURL(/\/dashboard\/patients\/demo-patient-021\/edit$/);
		await expect(page.getByLabel('First name')).toHaveValue('Quinn');
		await page.getByLabel('Phone', {exact: true}).fill('+1-555-010-9191');
		await page.getByRole('button', {name: 'Save changes'}).click();

		await expect(page).toHaveURL(/\/dashboard\/patients\/demo-patient-021$/);
		await expect(page.getByText('+1-555-010-9191')).toBeVisible();
	});

	test('hides create and edit from a provider', async ({page}) => {
		await signIn(page, 'provider@example.test', 'Demo-Provider-1');
		await openPatients(page);
		await expect(page.getByRole('link', {name: 'Add patient'})).toHaveCount(0);

		await page.getByRole('link', {name: 'View profile for Avery Carter'}).click();
		await expect(page.getByRole('heading', {level: 1, name: 'Avery Carter'})).toBeVisible();
		await expect(page.getByRole('link', {name: 'Edit patient'})).toHaveCount(0);
	});

	test('blocks a provider who opens create or edit directly', async ({page}) => {
		await signIn(page, 'provider@example.test', 'Demo-Provider-1');

		await page.goto('/dashboard/patients/new');
		await expect(page.getByText('You do not have access to create or edit patients.')).toBeVisible();
		await expect(page.getByRole('button', {name: 'Create patient'})).toHaveCount(0);

		await page.goto('/dashboard/patients/demo-patient-001/edit');
		await expect(page.getByText('You do not have access to create or edit patients.')).toBeVisible();
		await expect(page.getByRole('button', {name: 'Save changes'})).toHaveCount(0);
	});
});