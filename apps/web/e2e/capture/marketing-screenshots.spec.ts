import path from 'node:path';
import {expect, test, type Page} from '@playwright/test';
import {signInAsPracticeAdmin} from '../helpers/mock-auth';

/**
 * QA-012. Regenerates the marketing and README screenshots. Run with
 * `npm run screenshots:marketing`; not part of `e2e:mocks`.
 */
const OUTPUT_DIR = path.resolve(__dirname, '../../../marketing/public/marketing');

const SIGNED_IN_SCREENS = [
	{file: 'dashboard', route: '/dashboard', heading: 'Dashboard'},
	{file: 'patients', route: '/dashboard/patients', heading: 'Patients'},
	{file: 'appointments', route: '/dashboard/appointments', heading: 'Appointments'},
	{file: 'telehealth', route: '/dashboard/telehealth', heading: 'Telehealth'},
	{file: 'billing', route: '/dashboard/billing', heading: 'Billing'},
	{file: 'admin', route: '/dashboard/admin', heading: 'Administration'},
] as const;

async function settle(page: Page) {
	await page.waitForLoadState('networkidle');
	await page.evaluate(() => document.fonts.ready);
	await expect(page.locator('.tsqd-parent-container')).toHaveCount(0);
	await expect(page.locator('nextjs-portal')).toHaveCount(0);
}

async function capture(page: Page, file: string, options: {clip?: {width: number; height: number}} = {}) {
	await settle(page);
	await page.screenshot({
		path: path.join(OUTPUT_DIR, `${file}.png`),
		animations: 'disabled',
		caret: 'hide',
		clip: options.clip ? {x: 0, y: 0, ...options.clip} : undefined,
	});
}

test.describe.configure({mode: 'serial'});

test('captures the sign-in page', async ({page}) => {
	await page.setViewportSize({width: 1440, height: 1200});
	await page.goto('/login');
	await expect(page.getByRole('heading', {name: 'Sign in'})).toBeVisible();
	await expect(page.getByRole('link', {name: 'MedConnect Pro, back to home'})).toBeVisible();
	await expect(page.getByText('Demo accounts')).toBeVisible();
	await capture(page, 'login');
});

test('captures the signed-in screens and the Open Graph crop', async ({page}) => {
	await page.setViewportSize({width: 1440, height: 900});
	await signInAsPracticeAdmin(page);

	for (const screen of SIGNED_IN_SCREENS) {
		await page.goto(screen.route);
		await expect(page.getByRole('heading', {level: 1, name: screen.heading})).toBeVisible();
		await capture(page, screen.file);
		if (screen.file === 'dashboard') {
			await capture(page, 'og', {clip: {width: 1200, height: 630}});
		}
	}
});
