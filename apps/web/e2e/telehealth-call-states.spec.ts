import {expect, test, type Page} from '@playwright/test';
import {expectNoAxeViolations} from './helpers/axe';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

/**
 * QA-014: TH-08 call states and the room-closing notice in mock mode. `?mockState=` is read only by the
 * mock call stage (`lib/telehealth/mock-call-scenario.ts`); live mode ignores it.
 */
async function joinWithScenario(page: Page, scenario: string) {
	await signInAsPracticeAdmin(page);
	await page.goto(`/dashboard/telehealth/session-demo-appointment-002?mockState=${scenario}`);
	await page.getByRole('button', {name: 'Join visit'}).click();
	await expect(page.getByRole('region', {name: 'Video visit'})).toBeVisible();
}

async function expectNoHorizontalScroll(page: Page) {
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
	);
	expect(overflow).toBeLessThanOrEqual(0);
}

for (const width of [390, 320]) {
	test.describe(`Telehealth call states at ${width}px`, () => {
		test.use({viewport: {width, height: 800}});

		test('waiting: nobody else is here yet', async ({page}) => {
			await joinWithScenario(page, 'waiting');
			await expect(page.getByText(/^Waiting for .+ to join/)).toBeVisible();
			await expectNoHorizontalScroll(page);
			await expectNoAxeViolations(page, ['[aria-label="Video visit"]']);
		});

		test('participant left: Wait dismisses it and End visit is offered to the host', async ({page}) => {
			await joinWithScenario(page, 'participant-left');
			const status = page.getByRole('status').filter({hasText: 'left the call.'});
			await expect(status).toBeVisible();
			await expect(status).toContainText('The visit is still open.');
			await expect(status.getByRole('button', {name: 'End visit'})).toBeVisible();
			await expectNoAxeViolations(page, ['[aria-label="Video visit"]']);
			await status.getByRole('button', {name: 'Wait'}).click();
			await expect(page.getByText('left the call.')).toBeHidden();
			await expect(page.getByText(/^Waiting for .+ to join/)).toBeVisible();
		});

		test('reconnecting is announced politely', async ({page}) => {
			await joinWithScenario(page, 'reconnecting');
			await expect(page.getByRole('status').filter({hasText: /reconnecting/i})).toBeVisible();
			await expectNoHorizontalScroll(page);
		});

		test('device lost is an alert with a retry action', async ({page}) => {
			await joinWithScenario(page, 'device-lost');
			const alert = page.getByRole('alert').filter({hasText: 'Camera or microphone access was lost.'});
			await expect(alert).toBeVisible();
			await expect(alert.getByRole('button', {name: 'Retry devices'})).toBeVisible();
			await expectNoAxeViolations(page, ['[aria-label="Video visit"]']);
		});

		test('poor network offers to turn the camera off', async ({page}) => {
			await joinWithScenario(page, 'poor-network');
			const status = page.getByRole('status').filter({hasText: 'Your network is weak.'});
			await expect(status).toBeVisible();
			await status.getByRole('button', {name: 'Turn off camera'}).click();
			await expect(page.getByText('Your network is weak.')).toBeHidden();
		});

		test('closing notice is polite, does not take focus and has no extend action', async ({page}) => {
			await joinWithScenario(page, 'closing');
			const notice = page.getByRole('status').filter({hasText: /This visit closes in 5 minutes/});
			await expect(notice).toBeVisible();
			await expect(notice).not.toContainText(/extend/i);
			const focusInNotice = await notice.evaluate((element) => element.contains(document.activeElement));
			expect(focusInNotice).toBe(false);
			await expectNoAxeViolations(page, ['[aria-label="Video visit"]']);
		});
	});
}

test('an unknown mockState value is ignored', async ({page}) => {
	await joinWithScenario(page, 'not-a-state');
	await expect(page.getByText('Demo placeholder. Not a live video connection.')).toBeVisible();
});
