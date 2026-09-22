import {expect, test} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

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
		await page.getByLabel('Status').selectOption('inactive');
		await expect(page.getByText('Taylor Bennett')).toBeVisible();
		await expect(page.getByText('Avery Carter')).toHaveCount(0);
		await expect(page.getByRole('button', {name: 'Load more'})).toHaveCount(0);

		await page.getByLabel('Status').selectOption('all');
		await page.getByLabel('Sort by name').selectOption('name-desc');
		await expect(page.getByText('Skyler Ward')).toBeVisible();
		await expect(page.getByText('Avery Carter')).toHaveCount(0);

		await page.getByLabel('Sort by name').selectOption('name-asc');
		await expect(page.getByRole('button', {name: 'Load more'})).toBeVisible();
		await page.getByRole('button', {name: 'Load more'}).click();
		await expect(page.getByText('Morgan Morgan')).toBeVisible();
		await expect(page.getByRole('button', {name: 'Load more'})).toHaveCount(0);
	});
});
