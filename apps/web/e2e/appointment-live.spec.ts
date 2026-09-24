import {expect, test, type Page} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

function pad(value: number) {
	return String(value).padStart(2, '0');
}

function toDatetimeLocalValue(date: Date) {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function uniqueSlot() {
	const start = new Date(Date.UTC(2027, 5, 1, 10, 0, 0));
	start.setUTCMinutes(Date.now() % (60 * 24 * 20));
	const end = new Date(start.getTime() + 60 * 60 * 1000);
	return {start: toDatetimeLocalValue(start), end: toDatetimeLocalValue(end)};
}

async function openAppointments(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Appointments'}).click();
	await expect(page).toHaveURL(/\/dashboard\/appointments$/);
}

test.describe('Live appointment calendar and create', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('shows the seeded visit and creates another synthetic appointment', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openAppointments(page);

		await expect(page.getByRole('button', {name: 'Calendar'})).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByRole('button', {name: 'Week view'})).toHaveAttribute('aria-pressed', 'true');
		await expect(
			page.getByRole('button', {name: /Avery Quinn · Dr\. Jordan Ellis · Scheduled/}),
		).toBeVisible();

		await page.getByRole('link', {name: 'Schedule appointment'}).click();
		await expect(page).toHaveURL(/\/dashboard\/appointments\/new$/);

		const slot = uniqueSlot();
		await page.getByLabel('Patient').selectOption({label: 'Blake Chen'});
		await page.getByLabel('Provider').selectOption({label: 'Dr. Jordan Ellis'});
		await page.getByLabel('Start').fill(slot.start);
		await page.getByLabel('End').fill(slot.end);
		await page.getByLabel('Type').selectOption('office_visit');
		await page.getByRole('button', {name: 'Schedule appointment'}).click();

		await expect(page).toHaveURL(/\/dashboard\/appointments$/);
		await page.getByRole('button', {name: 'List'}).click();
		await expect(page.getByRole('list', {name: 'Appointments'})).toContainText('Blake Chen');
		await expect(page.getByRole('list', {name: 'Appointments'})).toContainText('Office visit');
	});
});
