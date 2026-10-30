import type {Page} from '@playwright/test';

/** `2026-10-20` becomes `10/20/2026`, the way the date field is typed. */
export function usDate(day: string): string {
	const [year, month, date] = day.split('-');
	return `${month}/${date}/${year}`;
}

/** `19:30` becomes `7:30 PM`. */
export function usTime(time: string): string {
	const [hours, minutes] = time.split(':').map(Number);
	return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

/** Types a date into a `DateField` by its label, for example "Date of birth". */
export async function fillDateField(page: Page, label: string, day: string) {
	await page.getByLabel(label, {exact: true}).fill(usDate(day));
}

/** Types a local `YYYY-MM-DDTHH:mm` into a `DateTimeField` by its legend, for example "Start". */
export async function fillDateTimeField(page: Page, legend: string, local: string) {
	const [day, time] = local.split('T');
	await page.getByLabel(`${legend} date`, {exact: true}).fill(usDate(day));
	const timeField = page.getByRole('combobox', {name: `${legend} time`, exact: true});
	await timeField.fill(usTime(time));
	await timeField.press('Tab');
}
