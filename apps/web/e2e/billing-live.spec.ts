import {expect, test, type Page} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

const invoiceUuid = /\/dashboard\/billing\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function openBilling(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Billing'}).click();
	await expect(page).toHaveURL(/\/dashboard\/billing$/);
}

test.describe('Live billing list and detail', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('shows seeded Avery Quinn invoices and opens UUID detail', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openBilling(page);

		await expect(page.getByRole('heading', {level: 1, name: 'Billing'})).toBeVisible();
		await expect(page.getByText('Synthetic demo. Payments and claims are not processed.')).toBeVisible();

		const invoices = page.getByRole('list', {name: 'Invoices'});
		await expect(invoices).toContainText('Avery Quinn');
		await expect(invoices).toContainText('Overdue');
		await expect(invoices).toContainText('$150.00');
		await expect(invoices).toContainText('Paid');
		await expect(invoices).toContainText('$80.00');

		await expect(page.getByRole('heading', {name: 'Payment boundary'})).toBeVisible();
		await expect(page.getByText(/Stripe\/ACH is not connected/)).toBeVisible();
		await expect(page.getByRole('button', {name: 'Record payment'})).toBeDisabled();
		await expect(page.getByRole('heading', {name: 'Claims boundary'})).toBeVisible();
		await expect(page.getByText(/Claims \/ EDI 837 is not connected/)).toBeVisible();

		const overdueRow = invoices.locator('li').filter({hasText: '$150.00'});
		await expect(overdueRow).toContainText('Overdue');
		await overdueRow.getByRole('link', {name: /View invoice .* for Avery Quinn/}).click();

		await expect(page).toHaveURL(invoiceUuid);
		await expect(page).not.toHaveURL(/demo-invoice-/);
		await expect(page.getByRole('heading', {level: 1, name: 'Invoice'})).toBeVisible();
		await expect(page.getByText('Avery Quinn')).toBeVisible();
		await expect(page.getByText('Overdue')).toBeVisible();
		await expect(page.getByRole('list', {name: 'Line items'})).toContainText('Office visit');
		await expect(page.getByRole('heading', {name: 'Payment boundary'})).toBeVisible();
		await expect(page.getByRole('heading', {name: 'Claims boundary'})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Record payment'})).toBeDisabled();

		await page.getByRole('link', {name: 'Back to billing'}).click();
		await expect(page).toHaveURL(/\/dashboard\/billing$/);
		await expect(page.getByRole('list', {name: 'Invoices'})).toContainText('Avery Quinn');
	});
});
