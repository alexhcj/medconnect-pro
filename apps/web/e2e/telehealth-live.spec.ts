import {expect, test, type Page} from '@playwright/test';
import {signInAsLiveProvider} from './helpers/mock-auth';

async function openTelehealth(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Telehealth'}).click();
	await expect(page).toHaveURL(/\/dashboard\/telehealth$/);
}

test.describe('Live telehealth session shell', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('creates, joins, and ends the seeded in-window visit as the live provider', async ({page}) => {
		await signInAsLiveProvider(page);
		await openTelehealth(page);

		await expect(page.getByRole('heading', {level: 1, name: 'Telehealth'})).toBeVisible();
		await expect(
			page.getByText('Synthetic demo. Not a production telehealth deployment.'),
		).toBeVisible();

		const visits = page.getByRole('list', {name: 'Telehealth visits'});
		await expect(visits).toContainText('Avery Quinn');
		await expect(visits).toContainText('Dr. Jordan Ellis');
		await expect(visits).toContainText('Telehealth');

		await page.getByRole('button', {name: 'Join visit'}).click();
		await expect(page).toHaveURL(/\/dashboard\/telehealth\/[0-9a-f-]{36}$/);
		await expect(page).not.toHaveURL(/session-/);
		await expect(page.getByRole('heading', {level: 1, name: 'Telehealth session'})).toBeVisible();
		await expect(page.getByRole('heading', {level: 2, name: 'Waiting room'})).toBeVisible();
		await expect(page.getByText('Avery Quinn')).toBeVisible();
		await expect(page.getByText('Dr. Jordan Ellis')).toBeVisible();

		await page.getByRole('button', {name: 'Join session'}).click();
		await expect(page.getByText('Demo placeholder. Not a live video connection.')).toBeVisible();
		await expect(page.getByRole('button', {name: 'Camera'})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Microphone'})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Screen share'})).toBeVisible();
		await expect(page.locator('iframe')).toHaveCount(0);
		await expect(page.locator('video')).toHaveCount(0);

		await page.getByRole('button', {name: 'End session'}).click();
		await expect(page).toHaveURL(/\/dashboard\/telehealth$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Telehealth'})).toBeVisible();
		await expect(page.getByRole('list', {name: 'Telehealth visits'})).toContainText('Avery Quinn');
	});
});
