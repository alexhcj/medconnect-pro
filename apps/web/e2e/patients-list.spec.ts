import {expect, test} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';
import {chooseSelectOption} from './helpers/select-fields';

test.describe('Patient list', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('searches, filters, sorts, and loads more patients', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await page.getByRole('button', {name: 'Open navigation'}).click();
		await page.getByRole('dialog').getByRole('link', {name: 'Patients'}).click();

		await expect(page).toHaveURL(/\/dashboard\/patients$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Patients'})).toBeVisible();
		await expect(page.getByLabel('Search patients')).toBeVisible();
		await expect(page.getByLabel('Status')).toBeVisible();
		await expect(page.getByLabel('Sort by name')).toBeVisible();
		await expect(page.getByRole('list', {name: 'Patients'})).toBeVisible();
		await expect(page.getByText('Avery Carter')).toBeVisible();
		await expect(page.getByText('Rowan Bailey')).toBeVisible();

		await page.getByLabel('Search patients').fill('Avery');
		await expect(page.getByRole('listitem')).toHaveCount(1);
		await expect(page.getByText('Avery Carter')).toBeVisible();

		await page.getByLabel('Search patients').fill('nomatch-zz');
		await expect(page.getByText('No patients match your search.')).toBeVisible();

		await page.getByLabel('Search patients').fill('');
		await chooseSelectOption(page, 'Status', 'Inactive');
		await expect(page.getByText('Taylor Bennett')).toBeVisible();
		await expect(page.getByText('Avery Carter')).toHaveCount(0);
		await expect(page.getByRole('navigation', {name: 'Patients pagination'})).toHaveCount(0);

		await chooseSelectOption(page, 'Status', 'All statuses');
		await chooseSelectOption(page, 'Sort by name', 'Last name Z–A');
		await expect(page.getByText('Skyler Ward')).toBeVisible();
		await expect(page.getByText('Avery Carter')).toHaveCount(0);

		await chooseSelectOption(page, 'Sort by name', 'Last name A–Z');
		await expect(page.getByRole('list', {name: 'Patients'}).getByRole('listitem')).toHaveCount(10);
		await expect(page.getByTestId('pagination-status')).toHaveText(/Showing 1–10/);
	});

	test('pages through patients and keeps the page in the URL', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await page.goto('/dashboard/patients');

		const rows = page.getByRole('list', {name: 'Patients'}).getByRole('listitem');
		await expect(rows).toHaveCount(10);
		await expect(page.getByRole('button', {name: 'Previous page'})).toBeDisabled();

		await page.getByRole('button', {name: 'Next page'}).click();
		await expect(page).toHaveURL(/patientsPage=2/);
		await expect(page.getByText('Morgan Morgan')).toBeVisible();
		await expect(page.getByText('Avery Carter')).toHaveCount(0);
		await expect(rows.count()).resolves.toBeLessThanOrEqual(10);

		await page.reload();
		await expect(page).toHaveURL(/patientsPage=2/);
		await expect(page.getByText('Morgan Morgan')).toBeVisible();

		await chooseSelectOption(page, 'Status', 'Active');
		await expect(page).not.toHaveURL(/patientsPage=/);

		await page.goBack();
		await expect(page).toHaveURL(/patientsPage=2/);
		await expect(page.getByText('Morgan Morgan')).toBeVisible();
	});

	test('fits a 320 px screen without horizontal scroll', async ({page}) => {
		await page.setViewportSize({width: 320, height: 800});
		await signInAsPracticeAdmin(page);
		await page.goto('/dashboard/patients');

		await expect(page.getByRole('navigation', {name: 'Patients pagination'})).toBeVisible();
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(0);
	});
});
