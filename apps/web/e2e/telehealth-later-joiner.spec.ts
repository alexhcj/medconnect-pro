import {expect, test, type Page} from '@playwright/test';
import {expectNoAxeViolations} from './helpers/axe';
import {signInAsPatient, signInAsPracticeAdmin} from './helpers/mock-auth';

/**
 * FE-067: a participant who opens a visit that is already in progress gets the green room first and
 * the call stage only after Join. `?mockVisit=in_progress` is read only by the mock API
 * (`lib/api/mocks/telehealth-mock.ts`); live mode ignores it and Nest decides the real order.
 */
const LIVE_VISIT = '/dashboard/telehealth/session-demo-appointment-002?mockVisit=in_progress';

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
	test.describe(`Telehealth later joiner at ${viewport.name}`, () => {
		test.use({viewport: {width: viewport.width, height: viewport.height}});

		test('patient sees the green room first, and the stage only after Join', async ({page}) => {
			await signInAsPatient(page);
			const requests: string[] = [];
			page.on('request', (request) => {
				requests.push(`${request.method()} ${request.url()}`);
			});
			await page.goto(LIVE_VISIT);

			await expect(page.getByRole('heading', {level: 2, name: /^Video visit/})).toBeVisible();
			await expect(page.getByText('This visit has already started', {exact: true})).toBeVisible();
			await expect(page.getByRole('button', {name: 'Join visit'})).toBeEnabled();
			await expect(page.getByRole('button', {name: 'Leave call'})).toHaveCount(0);
			// The green room mints no token and joins no Daily room.
			expect(requests.filter((entry) => /media-token|daily\.co/i.test(entry))).toEqual([]);
			await expectNoHorizontalScroll(page);
			await expectNoAxeViolations(page, ['main']);

			await page.getByRole('button', {name: 'Join visit'}).click();
			await expect(page.getByText('Demo placeholder. Not a live video connection.')).toBeVisible();
			await expect(page.getByText('This visit has already started', {exact: true})).toHaveCount(0);
		});

		test('a provider opening a live visit also gets the green room', async ({page}) => {
			await signInAsPracticeAdmin(page);
			await page.goto(LIVE_VISIT);

			await expect(page.getByText('This visit has already started', {exact: true})).toBeVisible();
			await expect(page.getByRole('button', {name: 'Leave call'})).toHaveCount(0);
			await page.getByRole('button', {name: 'Join visit'}).click();
			await expect(page.getByText('Demo placeholder. Not a live video connection.')).toBeVisible();
		});

		test('a reload goes back to the green room', async ({page}) => {
			await signInAsPatient(page);
			await page.goto(LIVE_VISIT);
			await page.getByRole('button', {name: 'Join visit'}).click();
			await expect(page.getByText('Demo placeholder. Not a live video connection.')).toBeVisible();

			await page.reload();
			await expect(page.getByRole('heading', {level: 2, name: /^Video visit/})).toBeVisible();
			await expect(page.getByRole('button', {name: 'Join visit'})).toBeEnabled();
		});
	});
}

test('the first joiner sees no already-started line', async ({page}) => {
	await signInAsPatient(page);
	await page.goto('/dashboard/telehealth/session-demo-appointment-002');
	await expect(page.getByRole('heading', {level: 2, name: /^Video visit/})).toBeVisible();
	await expect(page.getByText('This visit has already started', {exact: true})).toHaveCount(0);
});
