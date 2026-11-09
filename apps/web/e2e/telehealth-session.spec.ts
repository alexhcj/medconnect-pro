import {expect, test, type Page} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

async function openTelehealth(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Telehealth'}).click();
	await expect(page).toHaveURL(/\/dashboard\/telehealth$/);
}

async function joinMockVisit(page: Page) {
	await signInAsPracticeAdmin(page);
	await page.goto('/dashboard/telehealth/session-demo-appointment-002');
	await page.getByRole('button', {name: 'Join visit'}).click();
	await expect(page.getByRole('region', {name: 'Video visit'})).toBeVisible();
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

		await visits
			.getByRole('listitem')
			.filter({hasText: 'demo-appointment-002'})
			.getByRole('link', {name: 'Join visit'})
			.click();
		await expect(page).toHaveURL(/\/dashboard\/telehealth\/session-demo-appointment-002$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Telehealth session'})).toBeVisible();
		await expect(page.getByRole('heading', {level: 2, name: /^Video visit/})).toBeVisible();
		await expect(page.getByText('Taylor Bennett', {exact: true})).toBeVisible();
		await expect(page.getByText('Dr. Casey Walsh', {exact: true})).toBeVisible();

		await page.getByRole('button', {name: 'Join visit'}).click();
		await expect(page.getByText('Demo placeholder. Not a live video connection.')).toBeVisible();
		await expect(page.getByRole('button', {name: 'Camera'})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Microphone'})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Share screen'})).toBeVisible();
		await expect(page.getByRole('region', {name: 'Video visit'})).toBeVisible();
		await expect(page.getByText('Encrypted connection · This visit is not recorded')).toBeVisible();
		// The stage covers the dashboard sidebar and header, and the page behind it is inert.
		const behindIsInert = await page
			.getByRole('button', {name: 'Open navigation'})
			.evaluate((element) => Boolean(element.closest('[inert]')));
		expect(behindIsInert).toBe(true);

		await page.getByRole('button', {name: 'Leave call'}).click();
		await expect(page.getByText('You left the call. The visit is still open.')).toBeVisible();
		await expect(page).toHaveURL(/\/dashboard\/telehealth\/session-demo-appointment-002$/);
		await page.getByRole('button', {name: 'Rejoin call'}).click();
		await expect(page.getByText('Demo placeholder. Not a live video connection.')).toBeVisible();

		await page.getByRole('button', {name: 'End visit'}).click();
		await page.getByRole('dialog', {name: 'End this visit for everyone?'}).getByRole('button', {name: 'End visit'}).click();
		await expect(page).toHaveURL(/\/dashboard\/telehealth$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Telehealth'})).toBeVisible();
		await expect(page.getByRole('list', {name: 'Telehealth visits'})).toContainText('Taylor Bennett');
	});

	for (const width of [1440, 768]) {
		test(`shows the full control bar and a participants panel at ${width}px`, async ({page}) => {
			await page.setViewportSize({width, height: 900});
			await joinMockVisit(page);

			for (const name of ['Microphone', 'Camera', 'Share screen', 'Background', 'Devices', 'Participants', 'Leave call', 'End visit']) {
				await expect(page.getByRole('button', {name, exact: true})).toBeVisible();
			}
			await expect(page.getByRole('button', {name: 'More', exact: true})).toBeHidden();

			await page.getByRole('button', {name: 'Participants', exact: true}).click();
			const panel = page.getByRole('complementary', {name: 'Participants'});
			await expect(panel).toBeVisible();
			await expect(panel).toContainText('Only invited participants can join');
			await page.keyboard.press('Escape');
			await expect(panel).toBeHidden();
		});
	}

	for (const width of [390, 320]) {
		test(`collapses to five controls and a More sheet at ${width}px`, async ({page}) => {
			await page.setViewportSize({width, height: 720});
			await joinMockVisit(page);

			for (const name of ['Microphone', 'Camera', 'Flip camera', 'More', 'Leave call']) {
				await expect(page.getByRole('button', {name, exact: true})).toBeVisible();
			}
			for (const name of ['Share screen', 'Devices', 'Participants', 'Background', 'End visit']) {
				await expect(page.getByRole('button', {name, exact: true})).toBeHidden();
			}
			const scrolls = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
			expect(scrolls).toBe(false);

			await page.getByRole('button', {name: 'More', exact: true}).click();
			const sheet = page.getByRole('dialog', {name: 'More'});
			await expect(sheet.getByRole('button', {name: /Devices/})).toBeVisible();
			await expect(sheet.getByRole('button', {name: /Participants/})).toBeVisible();
			await expect(sheet.getByRole('button', {name: /End visit/})).toBeVisible();
			await page.keyboard.press('Escape');
			await expect(sheet).toBeHidden();
		});
	}

	test('toggles the microphone with a modifier shortcut only', async ({page}) => {
		await page.setViewportSize({width: 1440, height: 900});
		await joinMockVisit(page);
		const mic = page.getByRole('button', {name: 'Microphone', exact: true});

		await expect(mic).toHaveAttribute('aria-pressed', 'false');
		await page.keyboard.press('m');
		await expect(mic).toHaveAttribute('aria-pressed', 'false');
		await page.keyboard.press('Alt+KeyM');
		await expect(mic).toHaveAttribute('aria-pressed', 'true');
	});
});
