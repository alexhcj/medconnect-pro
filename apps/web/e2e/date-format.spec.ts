import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page} from '@playwright/test';
import {fillDateField, fillDateTimeField} from './helpers/date-fields';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

const US_DATE = /\d{2}\/\d{2}\/\d{4}/;
const US_TIME = /\b\d{1,2}:\d{2} (AM|PM)\b/;
// A Russian browser and a US time zone: the case FE-057 fixes (native fields showed дд.мм.гггг).
const RUSSIAN_BROWSER = {locale: 'ru-RU', timezoneId: 'America/Los_Angeles'} as const;

async function open(page: Page, path: string) {
	await signInAsPracticeAdmin(page);
	await page.goto(path);
}

test.describe('US date format in a Russian browser', () => {
	test.use({...RUSSIAN_BROWSER, viewport: {width: 1280, height: 900}});

	test('patient profile shows date of birth as MM/DD/YYYY, not ISO or dd.mm.yyyy', async ({page}) => {
		await open(page, '/dashboard/patients/demo-patient-001');
		const dob = page.locator('dt', {hasText: 'Date of birth'}).locator('xpath=following-sibling::dd[1]');
		await expect(dob).toHaveText(/^\d{2}\/\d{2}\/\d{4}$/);
		await expect(dob).not.toContainText('-');
		await expect(dob).not.toContainText('.');
	});

	test('appointments, billing and admin lists use US dates and 12-hour times', async ({page}) => {
		await open(page, '/dashboard/appointments');
		await page.getByRole('button', {name: 'List'}).click();
		const appointments = page.getByRole('list', {name: 'Appointments'});
		await expect(appointments).toContainText(US_DATE);
		await expect(appointments).toContainText(US_TIME);
		await expect(appointments).not.toContainText(/\d{2}\.\d{2}\.\d{4}/);
		await expect(appointments).not.toContainText(/\b\d{2}:\d{2}:\d{2}\b/);

		await page.goto('/dashboard/billing');
		const invoices = page.getByRole('list', {name: 'Invoices'});
		await expect(invoices).toContainText(new RegExp(`Due ${US_DATE.source}`));
		await expect(invoices).not.toContainText(/\d{2}\.\d{2}\.\d{4}/);

		await page.goto('/dashboard/admin');
		const events = page.getByRole('table', {name: 'Audit events'});
		await expect(events).toContainText(US_DATE);
		await expect(events).toContainText(US_TIME);
		await expect(events).not.toContainText(/\d{2}\.\d{2}\.\d{4}/);
	});

	test('telehealth visit shows a US range with a zone label', async ({page}) => {
		await open(page, '/dashboard/telehealth');
		await page
			.getByRole('list', {name: 'Telehealth visits'})
			.getByRole('listitem')
			.filter({hasText: 'demo-appointment-002'})
			.getByRole('link', {name: 'Join visit'})
			.click();
		await expect(page.getByRole('heading', {level: 2, name: 'Waiting room'})).toBeVisible();
		await expect(page.getByText(/\d{2}\/\d{2}\/\d{4}, \d{1,2}:\d{2} (AM|PM) – \d{1,2}:\d{2} (AM|PM) \S+/).first()).toBeVisible();
	});

	test('forms have no native date inputs and show the MM/DD/YYYY hint', async ({page}) => {
		await open(page, '/dashboard/patients/new');
		await expect(page.locator('input[type="date"], input[type="datetime-local"], input[type="time"]')).toHaveCount(0);
		await expect(page.getByLabel('Date of birth')).toHaveAttribute('placeholder', 'MM/DD/YYYY');
		await expect(page.getByText('MM/DD/YYYY', {exact: true})).toBeVisible();

		await page.goto('/dashboard/appointments/new');
		await expect(page.locator('input[type="date"], input[type="datetime-local"], input[type="time"]')).toHaveCount(0);

		await page.goto('/dashboard/admin');
		await expect(page.locator('input[type="date"], input[type="datetime-local"], input[type="time"]')).toHaveCount(0);
	});
});

test.describe('Date field and calendar', () => {
	test.use({viewport: {width: 1280, height: 900}});

	test('opens from the button, moves with the keyboard and returns focus on Escape', async ({page}) => {
		await open(page, '/dashboard/patients/new');
		await fillDateField(page, 'Date of birth', '1991-03-04');
		const button = page.getByRole('button', {name: 'Choose date, selected date is March 4, 1991'});

		await button.click();
		const dialog = page.getByRole('dialog', {name: 'Choose date of birth'});
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('status')).toHaveText('March 1991');
		await expect(dialog.getByRole('button', {name: /March 4th, 1991, selected/})).toBeFocused();

		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('PageDown');
		await expect(dialog.getByRole('status')).toHaveText('April 1991');
		await page.keyboard.press('Shift+PageUp');
		await expect(dialog.getByRole('status')).toHaveText('April 1990');

		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(button).toBeFocused();
		await expect(page.getByLabel('Date of birth')).toHaveValue('03/04/1991');
	});

	test('selects a day with Enter and writes it into the field', async ({page}) => {
		await open(page, '/dashboard/patients/new');
		await fillDateField(page, 'Date of birth', '1991-03-04');
		await page.getByRole('button', {name: /Choose date/}).click();
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('Enter');

		await expect(page.getByLabel('Date of birth')).toHaveValue('03/05/1991');
		await expect(page.getByRole('dialog')).toHaveCount(0);
	});

	test('explains an invalid or future date as text', async ({page}) => {
		await open(page, '/dashboard/patients/new');
		const dob = page.getByLabel('Date of birth');

		await dob.fill('02/30/1991');
		await expect(page.getByRole('alert').filter({hasText: 'Enter a real date as MM/DD/YYYY'})).toBeVisible();
		await expect(dob).toHaveAttribute('aria-invalid', 'true');

		await dob.fill('01/01/2999');
		await expect(page.getByRole('alert').filter({hasText: /Date must be on or before \d{2}\/\d{2}\/\d{4}/})).toBeVisible();
	});

	test('has no axe violations with the calendar open', async ({page}) => {
		await open(page, '/dashboard/patients/new');
		await page.getByRole('button', {name: 'Choose date'}).click();
		await expect(page.getByRole('dialog', {name: 'Choose date of birth'})).toBeVisible();

		const results = await new AxeBuilder({page})
			.include('[role="dialog"]')
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
			.analyze();
		expect(
			results.violations.map(
				(violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
			),
		).toEqual([]);
	});
});

test.describe('Appointment date and time', () => {
	test.use({viewport: {width: 1280, height: 900}, ...RUSSIAN_BROWSER});

	test('types a start, fills End 30 minutes later and shows the viewer time zone', async ({page}) => {
		await open(page, '/dashboard/appointments/new');
		await fillDateTimeField(page, 'Start', '2026-10-20T10:00');

		await expect(page.getByLabel('End date', {exact: true})).toHaveValue('10/20/2026');
		await expect(page.getByRole('combobox', {name: 'End time', exact: true})).toHaveValue('10:30 AM');
		await expect(page.getByText(/MM\/DD\/YYYY · h:mm AM\/PM · Pacific (Daylight|Standard) Time/).first()).toBeVisible();
		await expect(page.getByText(/^P[DS]T$/).first()).toBeVisible();
	});

	test('lists 15-minute times and disables end times before the start', async ({page}) => {
		await open(page, '/dashboard/appointments/new');
		await fillDateTimeField(page, 'Start', '2026-10-20T10:00');
		await page.getByRole('combobox', {name: 'End time', exact: true}).click();

		const list = page.getByRole('listbox');
		await expect(list.getByRole('option', {name: '10:15 AM'})).toBeVisible();
		await expect(list.getByRole('option', {name: '9:45 AM'})).toHaveAttribute('aria-disabled', 'true');
		await list.getByRole('option', {name: '11:15 AM'}).click();
		await expect(page.getByRole('combobox', {name: 'End time', exact: true})).toHaveValue('11:15 AM');
	});

	test('keeps date values out of the URL, storage and console', async ({page}) => {
		const logs: string[] = [];
		page.on('console', (message) => logs.push(message.text()));
		const requests: string[] = [];
		page.on('request', (request) => requests.push(request.url()));

		await open(page, '/dashboard/appointments/new');
		await fillDateTimeField(page, 'Start', '2026-10-20T10:00');
		await expect(page).toHaveURL(/\/dashboard\/appointments\/new$/);

		const stored = await page.evaluate(() => JSON.stringify({...localStorage, ...sessionStorage}));
		expect(stored).not.toMatch(/10\/20\/2026|2026-10-20/);
		expect(logs.join('\n')).not.toMatch(/10\/20\/2026|2026-10-20/);
		expect(requests.filter((url) => /10\/20\/2026|2026-10-20|10%2F20%2F2026/.test(url))).toEqual([]);
		const external = requests.filter((url) => !url.startsWith('http://localhost') && !url.startsWith('data:') && !url.startsWith('blob:'));
		expect(external).toEqual([]);
	});
});

test.describe('Admin date filters', () => {
	test.use({viewport: {width: 1280, height: 900}});

	test('types a range, keeps it as YYYY-MM-DD in the list query and blocks a reversed range', async ({page}) => {
		await open(page, '/dashboard/admin');
		await page.getByLabel('From', {exact: true}).first().fill('10/05/2026');
		await expect(page).toHaveURL(/auditFrom=2026-10-05/);

		await page.getByLabel('To', {exact: true}).first().fill('10/01/2026');
		await expect(page.getByRole('alert').filter({hasText: 'The end date must be on or after the start date.'})).toBeVisible();
		await expect(page).not.toHaveURL(/auditTo=/);
	});
});

test.describe('Date fields at 320 px', () => {
	test.use({viewport: {width: 320, height: 800}});

	test('reflow without horizontal scroll and open as a bottom sheet', async ({page}) => {
		await open(page, '/dashboard/appointments/new');
		await fillDateTimeField(page, 'Start', '2026-10-20T10:00');
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
		expect(overflow).toBeLessThanOrEqual(0);

		await page.getByRole('button', {name: 'Choose start date, selected date is October 20, 2026'}).click();
		const dialog = page.getByRole('dialog', {name: 'Choose start date'});
		await expect(dialog).toBeVisible();
		const box = await dialog.boundingBox();
		expect(box?.width).toBeLessThanOrEqual(320);
		expect(box?.x).toBeGreaterThanOrEqual(0);
		await expect(dialog.getByRole('button', {name: 'Close calendar'})).toBeVisible();
		const day = await dialog.getByRole('button', {name: /October 20th, 2026/}).boundingBox();
		expect(day?.width).toBeGreaterThanOrEqual(24);
		expect(day?.height).toBeGreaterThanOrEqual(24);
	});
});
