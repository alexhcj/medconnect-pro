import {expect, test, type Page} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

async function openTelehealth(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Telehealth'}).click();
	await expect(page).toHaveURL(/\/dashboard\/telehealth$/);
}

test.describe('Telehealth session shell', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('joins a visit from the lobby, shows media placeholders, then leaves', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openTelehealth(page);

		await expect(page.getByRole('heading', {level: 1, name: 'Telehealth'})).toBeVisible();
		await expect(
			page.getByText('Synthetic demo. Not a production telehealth deployment.'),
		).toBeVisible();

		const visits = page.getByRole('list', {name: 'Telehealth visits'});
		await expect(visits).toContainText('Taylor Bennett');
		await expect(visits).toContainText('Dr. Casey Walsh');
		await expect(visits).toContainText('Telehealth');
		await expect(visits).toContainText('demo-appointment-002');

		await page.getByRole('link', {name: 'Join visit'}).click();
		await expect(page).toHaveURL(/\/dashboard\/telehealth\/session-demo-appointment-002$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Telehealth session'})).toBeVisible();
		await expect(page.getByRole('heading', {level: 2, name: 'Waiting room'})).toBeVisible();
		await expect(page.getByText('Taylor Bennett')).toBeVisible();
		await expect(page.getByText('Dr. Casey Walsh')).toBeVisible();

		await page.getByRole('button', {name: 'Join session'}).click();
		await expect(page.getByText('Demo placeholder. Not a live video connection.')).toBeVisible();
		await expect(page.getByRole('button', {name: 'Camera'})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Microphone'})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Screen share'})).toBeVisible();

		await page.getByRole('button', {name: 'Leave session'}).click();
		await expect(page).toHaveURL(/\/dashboard\/telehealth$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Telehealth'})).toBeVisible();
		await expect(page.getByRole('list', {name: 'Telehealth visits'})).toContainText('Taylor Bennett');
	});
});
