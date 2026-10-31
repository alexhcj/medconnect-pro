import {expect, test, type Page} from '@playwright/test';
import {fillDateTimeField} from './helpers/date-fields';
import {chooseSelectOption} from './helpers/select-fields';
import {signInAsNurse, signInAsPracticeAdmin} from './helpers/mock-auth';

function toDatetimeLocalValue(iso: string) {
	const date = new Date(iso);
	const pad = (value: number) => String(value).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function openAppointments(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Appointments'}).click();
	await expect(page).toHaveURL(/\/dashboard\/appointments$/);
}

async function fillAppointment(
	page: Page,
	values: {patient: string; provider: string; start: string; end: string; type: string},
) {
	await chooseSelectOption(page, 'Patient', values.patient);
	await chooseSelectOption(page, 'Provider', values.provider);
	await fillDateTimeField(page, 'Start', values.start);
	await fillDateTimeField(page, 'End', values.end);
	await chooseSelectOption(page, 'Type', values.type);
}

test.describe('Appointment creation', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('blocks an empty create, saves a visit, then rejects a provider conflict', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openAppointments(page);
		await page.getByRole('link', {name: 'Schedule appointment'}).click();

		await expect(page).toHaveURL(/\/dashboard\/appointments\/new$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Schedule appointment'})).toBeVisible();
		await page.getByRole('button', {name: 'Schedule appointment'}).click();
		await expect(page.getByText('Select a patient')).toBeVisible();
		await expect(page).toHaveURL(/\/dashboard\/appointments\/new$/);

		await fillAppointment(page, {
			patient: 'Jordan Brooks',
			provider: 'Dr. Jordan Ellis',
			start: '2026-10-20T10:00',
			end: '2026-10-20T11:00',
			type: 'Office visit',
		});
		await page.getByRole('button', {name: 'Schedule appointment'}).click();

		await expect(page).toHaveURL(/\/dashboard\/appointments$/);
		await expect(page.getByRole('button', {name: 'Calendar'})).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByRole('button', {name: 'Week view'})).toHaveAttribute('aria-pressed', 'true');
		await page.getByRole('button', {name: 'Next period'}).click();
		await expect(
			page.getByRole('button', {name: /Jordan Brooks · Dr\. Jordan Ellis · Scheduled/}),
		).toBeVisible();

		await page.getByRole('button', {name: 'List'}).click();
		await expect(page.getByRole('list', {name: 'Appointments'})).toContainText('Jordan Brooks');
		await expect(page.getByRole('list', {name: 'Appointments'})).toContainText('Office visit');

		await page.getByRole('link', {name: 'Schedule appointment'}).click();
		const conflictStart = toDatetimeLocalValue('2026-10-15T14:00:00.000Z');
		const conflictEnd = toDatetimeLocalValue('2026-10-15T15:00:00.000Z');
		await fillAppointment(page, {
			patient: 'Jordan Brooks',
			provider: 'Dr. Jordan Ellis',
			start: conflictStart,
			end: conflictEnd,
			type: 'Follow-up',
		});
		await page.getByRole('button', {name: 'Schedule appointment'}).click();

		await expect(page.locator('#start-error')).toHaveText(
			'This time overlaps an existing appointment for the provider.',
		);
		await expect(page.getByLabel('Start date', {exact: true})).toHaveAttribute('aria-invalid', 'true');
		await expect(page).toHaveURL(/\/dashboard\/appointments\/new$/);
	});

	test('hides schedule from a nurse', async ({page}) => {
		await signInAsNurse(page);
		await openAppointments(page);

		await expect(page.getByRole('heading', {level: 1, name: 'Appointments'})).toBeVisible();
		await expect(page.getByRole('link', {name: 'Schedule appointment'})).toHaveCount(0);

		await page.getByRole('button', {name: 'List'}).click();
		await expect(page.getByRole('list', {name: 'Appointments'})).toBeVisible();
		await expect(page.getByRole('link', {name: 'Schedule appointment'})).toHaveCount(0);
	});

	test('blocks a nurse who opens create directly', async ({page}) => {
		await signInAsNurse(page);

		await page.goto('/dashboard/appointments/new');
		await expect(page.getByText('You do not have access to create appointments.')).toBeVisible();
		await expect(page.getByRole('button', {name: 'Schedule appointment'})).toHaveCount(0);
	});
});
