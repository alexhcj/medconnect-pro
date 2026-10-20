import {expect, test, type Page} from '@playwright/test';
import {signInAsPatient, signInAsPracticeAdmin} from './helpers/mock-auth';

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
		await expect(page.getByText('Synthetic demo. Demo payments do not collect card numbers.')).toBeVisible();

		const invoices = page.getByRole('list', {name: 'Invoices'});
		await expect(invoices).toContainText('Avery Carter');
		await expect(invoices).toContainText('Issued');
		await expect(invoices).toContainText('$150.00');

		await expect(page.getByRole('heading', {name: 'Payment boundary'})).toBeVisible();
		await expect(page.getByText(/Open an unpaid invoice to record a demo payment/)).toBeVisible();
		await expect(page.getByRole('button', {name: 'Record payment'})).toBeDisabled();
		await expect(page.getByRole('heading', {name: 'Claims boundary'})).toBeVisible();
		await expect(page.getByText(/Labeled EDI 837 envelopes derived from visible invoices/)).toBeVisible();
		await expect(page.getByRole('list', {name: 'Claim envelopes'})).toContainText('Not submitted');
		await expect(page.getByRole('list', {name: 'Claim envelopes'})).toContainText('EDI 837 (labeled)');

		await page.getByRole('link', {name: 'View invoice demo-invoice-001 for Avery Carter'}).click();
		await expect(page).toHaveURL(/\/dashboard\/billing\/demo-invoice-001$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Invoice'})).toBeVisible();
		await expect(page.getByText('demo-invoice-001', {exact: true})).toBeVisible();
		await expect(page.getByText('Avery Carter')).toBeVisible();
		await expect(page.getByRole('list', {name: 'Line items'})).toContainText('Office visit');
		await expect(page.getByRole('heading', {name: 'Payment boundary'})).toBeVisible();
		await expect(page.getByRole('heading', {name: 'Claims boundary'})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Record payment'})).toBeEnabled();

		await page.getByRole('link', {name: 'Back to billing'}).click();
		await expect(page).toHaveURL(/\/dashboard\/billing$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Billing'})).toBeVisible();
		await expect(page.getByRole('list', {name: 'Invoices'})).toContainText('Avery Carter');
	});

	test('records a demo payment on an unpaid invoice', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openBilling(page);

		await page.getByRole('link', {name: 'View invoice demo-invoice-003 for Avery Carter'}).click();
		await expect(page.getByRole('button', {name: 'Record payment'})).toBeEnabled();
		await page.getByRole('button', {name: 'Record payment'}).click();

		const dialog = page.getByRole('dialog', {name: 'Record payment'});
		await expect(dialog).toBeVisible();
		await dialog.getByRole('radio', {name: 'ACH (demo)'}).click();
		await dialog.getByRole('button', {name: 'Confirm payment'}).click();

		const notice = page.getByRole('status').filter({hasText: 'Payment recorded'});
		await expect(notice).toBeVisible();
		await expect(notice).toContainText('ACH (demo)');
		await expect(notice).toContainText('Processor ref');
		await expect(page.getByText('This invoice is already paid. Hosted Stripe is not connected.')).toBeVisible();
		await expect(page.getByRole('button', {name: 'Record payment'})).toBeDisabled();
		await expect(page.getByText('Paid', {exact: true})).toHaveClass(/text-success-strong/);

		await notice.getByRole('button', {name: 'Dismiss payment notification'}).click();
		await expect(notice).toBeHidden();

		await page.getByRole('link', {name: 'Back to billing'}).click();
		const row = page.getByRole('list', {name: 'Invoices'}).getByRole('listitem').filter({hasText: 'Due'});
		await expect(row.filter({has: page.getByRole('link', {name: /demo-invoice-003/})})).toContainText('Paid');
	});

	test('colours invoice status while keeping the text label', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openBilling(page);

		const invoices = page.getByRole('list', {name: 'Invoices'});
		await expect(invoices.getByText('Issued', {exact: true}).first()).toHaveClass(/text-foreground-secondary/);
		await expect(invoices.getByText('Paid', {exact: true}).first()).toHaveClass(/text-success-strong/);
		await expect(invoices.getByText('Overdue', {exact: true}).first()).toHaveClass(/text-danger/);
	});

	test('a patient sees only their own invoices and claims, and not-found for another', async ({page}) => {
		await signInAsPatient(page);
		await openBilling(page);

		const invoices = page.getByRole('list', {name: 'Invoices'});
		await expect(invoices).toContainText('Avery Carter');
		await expect(invoices).not.toContainText('Taylor Bennett');
		await expect(invoices).not.toContainText('Jordan Brooks');
		await expect(invoices.getByRole('listitem')).toHaveCount(2);
		await expect(page.getByRole('list', {name: 'Claim envelopes'}).getByRole('listitem')).toHaveCount(2);

		await page.goto('/dashboard/billing/demo-invoice-002');
		await expect(page.getByRole('alert').filter({hasText: 'Invoice was not found.'})).toBeVisible();
	});
});
