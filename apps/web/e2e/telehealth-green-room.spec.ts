import {expect, test, type Page} from '@playwright/test';
import {expectNoAxeViolations} from './helpers/axe';
import {signInAsPatient, signInAsPracticeAdmin} from './helpers/mock-auth';

const VISIT = '/dashboard/telehealth/session-demo-appointment-002';

async function openGreenRoom(page: Page, state?: 'checking' | 'blocked' | 'no_camera') {
	await signInAsPracticeAdmin(page);
	await page.goto(state ? `${VISIT}?prejoin=${state}` : VISIT);
	await expect(page.getByRole('heading', {level: 2, name: /^Video visit/})).toBeVisible();
}

async function expectNoHorizontalScroll(page: Page) {
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
	expect(overflow).toBeLessThanOrEqual(0);
}

const VIEWPORTS = [
	{name: '1440', width: 1440, height: 1024},
	{name: '390', width: 390, height: 844},
	{name: '320', width: 320, height: 640},
] as const;

for (const viewport of VIEWPORTS) {
	test.describe(`Telehealth green room at ${viewport.name}`, () => {
		test.use({viewport: {width: viewport.width, height: viewport.height}});

		test('ready state: preview placeholder, meter, checks and approved wording', async ({page}) => {
			await openGreenRoom(page);

			await expect(page.getByRole('img', {name: /Camera preview placeholder/})).toBeVisible();
			await expect(page.getByRole('meter', {name: 'Microphone input level'})).toHaveAttribute('aria-valuenow', '8');
			await expect(page.getByRole('list', {name: 'Connection checks'})).toContainText('Checked after you join');
			await expect(page.getByText('Encrypted connection. This visit is not recorded.')).toBeVisible();
			await expect(page.getByRole('button', {name: 'Join visit'})).toBeEnabled();
			const text = (await page.getByRole('main').innerText()).toLowerCase();
			expect(text).not.toMatch(/\b(secure|private|end-to-end)\b/);
			await expectNoHorizontalScroll(page);
			await expectNoAxeViolations(page, ['main']);
		});

		test('blocked state: recovery steps, Try again and audio-only join', async ({page}) => {
			await openGreenRoom(page, 'blocked');

			await expect(page.getByRole('heading', {name: 'Camera and microphone are blocked'})).toBeVisible();
			await expect(page.getByRole('button', {name: 'Try again'})).toBeVisible();
			await expectNoHorizontalScroll(page);
			await expectNoAxeViolations(page, ['main']);

			await page.getByRole('button', {name: 'Join with audio only'}).last().click();
			await expect(page.getByText('Demo placeholder. Not a live video connection.')).toBeVisible();
		});

		test('no camera state: Check again recovers', async ({page}) => {
			await openGreenRoom(page, 'no_camera');

			await expect(page.getByRole('heading', {name: 'No camera found'})).toBeVisible();
			await expectNoHorizontalScroll(page);
			await page.getByRole('button', {name: 'Check again'}).click();
			await expect(page.getByRole('heading', {name: 'No camera found'})).toBeHidden();
			await expect(page.getByRole('button', {name: 'Join visit'})).toBeEnabled();
		});

		test('checking state disables Join', async ({page}) => {
			await openGreenRoom(page, 'checking');

			await expect(page.getByRole('button', {name: 'Join visit'})).toBeDisabled();
			await expectNoHorizontalScroll(page);
		});
	});
}

test.describe('Telehealth green room interactions', () => {
	test.use({viewport: {width: 1440, height: 1024}});

	test('background options, test sound and keyboard-only operation', async ({page}) => {
		await openGreenRoom(page);

		await page.getByRole('radio', {name: 'Image'}).click();
		await expect(page.getByRole('radio', {name: 'Clinic exam room'})).toBeVisible();
		await page.getByRole('radio', {name: 'Home living room'}).click();
		await expect(page.getByRole('radio', {name: 'Home living room'})).toBeChecked();
		await page.getByRole('radio', {name: 'Blur'}).click();
		await expect(page.getByRole('radio', {name: 'Clinic exam room'})).toBeHidden();
		await expectNoAxeViolations(page, ['main']);

		await page.getByRole('button', {name: 'Play test sound'}).click();

		// Keyboard only: arrows move the background, Enter opens a picker, Tab reaches Join.
		await page.getByRole('radio', {name: 'None'}).focus();
		await page.keyboard.press('ArrowRight');
		await expect(page.getByRole('radio', {name: 'Blur'})).toBeChecked();
		await page.getByRole('button', {name: /Camera/}).focus();
		await page.keyboard.press('Enter');
		await expect(page.getByRole('option', {name: 'Integrated Camera'})).toBeVisible();
		await page.keyboard.press('Escape');
		await page.getByRole('button', {name: 'Join visit'}).focus();
		await page.keyboard.press('Enter');
		await expect(page.getByText('Demo placeholder. Not a live video connection.')).toBeVisible();
	});

	test('sends no device, network or background data to the API', async ({page}) => {
		await openGreenRoom(page);
		const requests: string[] = [];
		page.on('request', (request) => {
			if (request.method() !== 'GET') {
				requests.push(`${request.method()} ${request.url()} ${request.postData() ?? ''}`);
			}
		});

		await page.getByRole('radio', {name: 'Blur'}).click();
		await page.getByRole('button', {name: 'Play test sound'}).click();
		await page.getByRole('button', {name: /Camera/}).click();
		await page.getByRole('option', {name: 'Integrated Camera'}).click();

		expect(requests.filter((entry) => /camera|microphone|speaker|device|background|blur|network/i.test(entry))).toEqual([]);
	});
});

test.describe('Telehealth green room demo persona camera (FE-065)', () => {
	test.use({viewport: {width: 1440, height: 1024}});

	test('a demo account picks its own persona, labeled as synthetic', async ({page}) => {
		await signInAsPatient(page);
		await page.goto(VISIT);
		await expect(page.getByRole('heading', {level: 2, name: /^Video visit/})).toBeVisible();

		const source = page.getByRole('radiogroup', {name: 'Camera source'});
		await expect(source.getByRole('radio', {name: 'My camera'})).toBeChecked();
		await expect(page.getByTestId('persona-demo-banner')).toBeVisible();

		await source.getByRole('radio', {name: 'Demo persona camera'}).click();
		const personas = page.getByRole('list', {name: 'Demo personas'});
		await expect(personas.getByRole('listitem')).toHaveCount(3);
		await expect(personas.locator('[aria-current="true"]')).toContainText('Avery Quinn');
		await expect(personas.locator('[aria-disabled="true"]')).toHaveCount(2);
		await expect(page.getByText('Demo · synthetic camera').first()).toBeVisible();
		await expect(page.getByText('Your real camera stays private')).toBeVisible();
		await expectNoAxeViolations(page, ['main']);

		await page.getByRole('radio', {name: 'My camera'}).click();
		await expect(personas).toBeHidden();
	});

	test('keyboard: arrows move the camera source and the persona is announced', async ({page}) => {
		await signInAsPatient(page);
		await page.goto(VISIT);
		await page.getByRole('radio', {name: 'My camera'}).focus();
		await page.keyboard.press('ArrowRight');
		await expect(page.getByRole('radio', {name: 'Demo persona camera'})).toBeChecked();
		await expect(page.locator('[aria-live="polite"]').first()).toContainText('Demo persona camera on.');
	});

	test('reduced motion and the mobile layout have no horizontal scroll', async ({page}) => {
		await page.emulateMedia({reducedMotion: 'reduce'});
		await page.setViewportSize({width: 390, height: 844});
		await signInAsPatient(page);
		await page.goto(VISIT);
		await page.getByRole('button', {name: 'Devices'}).click();
		await page.getByRole('radio', {name: 'Demo persona camera'}).click();
		await expect(page.getByRole('list', {name: 'Demo personas'})).toBeVisible();
		await expectNoHorizontalScroll(page);
		await expectNoAxeViolations(page, ['main']);
	});

	test('joins with the persona and the local tile keeps the label', async ({page}) => {
		await signInAsPatient(page);
		await page.goto(VISIT);
		await page.getByRole('radio', {name: 'Demo persona camera'}).click();
		await expect(page.getByRole('button', {name: 'Join visit'})).toBeEnabled();
		await page.getByRole('button', {name: 'Join visit'}).click();
		await expect(page.getByText('Demo placeholder. Not a live video connection.')).toBeVisible();
	});

	test('sends no persona choice to the API', async ({page}) => {
		await signInAsPatient(page);
		await page.goto(VISIT);
		const requests: string[] = [];
		page.on('request', (request) => {
			if (request.method() !== 'GET') {
				requests.push(`${request.method()} ${request.url()} ${request.postData() ?? ''}`);
			}
		});
		await page.getByRole('radio', {name: 'Demo persona camera'}).click();
		await expect(page.getByRole('list', {name: 'Demo personas'})).toBeVisible();
		expect(requests.filter((entry) => /persona|synthetic|camera/i.test(entry))).toEqual([]);
	});
});
