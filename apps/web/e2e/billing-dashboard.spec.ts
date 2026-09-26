import {expect, test, type Page} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';

async function openBilling(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Billing'}).click();
	await expect(page).toHaveURL(/\/dashboard\/billing$/);
}

test.describe('Billing dashboard', () => {
	test.use({viewport: {width: 768, height: 1024}});

	test('lists synthetic invoices, opens detail, and labels payment/claims boundaries', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openBilling(page);

		await expect(page.getByRole('heading', {level: 1, name: 'Billing'})).toBeVisible();
		await expect(page.getByText('Synthetic demo. Payments and claims are not processed.')).toBeVisible();

		const invoices = page.getByRole('list', {name: 'Invoices'});
		await expect(invoices).toContainText('Avery Carter');
		await expect(invoices).toContainText('Issued');
		await expect(invoices).toContainText('$150.00');

		await expect(page.getByRole('heading', {name: 'Payment boundary'})).toBeVisible();
		await expect(page.getByText(/Stripe\/ACH is not connected/)).toBeVisible();
		await expect(page.getByRole('button', {name: 'Record payment'})).toBeDisabled();
		await expect(page.getByRole('heading', {name: 'Claims boundary'})).toBeVisible();
		await expect(page.getByText(/Claims \/ EDI 837 is not connected/)).toBeVisible();

		await page.getByRole('link', {name: 'View invoice demo-invoice-001 for Avery Carter'}).click();
		await expect(page).toHaveURL(/\/dashboard\/billing\/demo-invoice-001$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Invoice'})).toBeVisible();
		await expect(page.getByText('demo-invoice-001')).toBeVisible();
		await expect(page.getByText('Avery Carter')).toBeVisible();
		await expect(page.getByRole('list', {name: 'Line items'})).toContainText('Office visit');
		await expect(page.getByRole('heading', {name: 'Payment boundary'})).toBeVisible();
		await expect(page.getByRole('heading', {name: 'Claims boundary'})).toBeVisible();

		await page.getByRole('link', {name: 'Back to billing'}).click();
		await expect(page).toHaveURL(/\/dashboard\/billing$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Billing'})).toBeVisible();
		await expect(page.getByRole('list', {name: 'Invoices'})).toContainText('Avery Carter');
	});
});
