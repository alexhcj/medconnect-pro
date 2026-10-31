import {expect, test, type Page} from '@playwright/test';
import {signInAsPatient, signInAsPracticeAdmin} from './helpers/mock-auth';
import {chooseSelectOption} from './helpers/select-fields';

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
		await expect(page.getByRole('heading', {name: 'Claims envelopes'})).toBeVisible();
		await expect(page.getByText(/Labeled EDI 837 envelopes derived from visible invoices/)).toBeVisible();
		await expect(page.getByRole('list', {name: 'Claims envelopes'})).toContainText('Not submitted');
		await expect(page.getByRole('list', {name: 'Claims envelopes'})).toContainText('EDI 837 (labeled)');

		await page.getByRole('link', {name: 'View invoice demo-invoice-001 for Avery Carter'}).click();
		await expect(page).toHaveURL(/\/dashboard\/billing\/demo-invoice-001$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Invoice'})).toBeVisible();
		await expect(page.getByText('demo-invoice-001', {exact: true})).toBeVisible();
		await expect(page.getByText('Avery Carter')).toBeVisible();
		await expect(page.getByRole('list', {name: 'Line items'})).toContainText('Office visit');
		await expect(page.getByRole('heading', {name: 'Payment boundary'})).toBeVisible();
		await expect(page.getByRole('heading', {name: 'Claims envelopes'})).toBeVisible();
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
		await expect(invoices.getByRole('listitem')).toHaveCount(5);
		await expect(page.getByText('Showing 1–5 of 5 invoices')).toBeVisible();
		await expect(page.getByRole('list', {name: 'Claims envelopes'}).getByRole('listitem')).toHaveCount(5);
		await expect(page.getByRole('navigation', {name: 'Invoices pagination'})).toHaveCount(0);

		await page.goto('/dashboard/billing/demo-invoice-002');
		await expect(page.getByRole('alert').filter({hasText: 'Invoice was not found.'})).toBeVisible();
	});

	test('pages invoices and claims independently and keeps position in the URL', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openBilling(page);

		const invoices = page.getByRole('list', {name: 'Invoices'});
		const claims = page.getByRole('list', {name: 'Claims envelopes'});
		await expect(page.getByText(/Showing 1–10 of 35 invoices/)).toContainText('newest first');
		await expect(invoices.getByRole('listitem')).toHaveCount(10);
		await expect(page.getByText('Showing 1–10 of 35 claims envelopes')).toBeVisible();

		await page.getByRole('navigation', {name: 'Invoices pagination'}).getByRole('button', {name: 'Next page'}).click();
		await expect(page).toHaveURL(/invoicesPage=2/);
		await expect(page.getByText('Showing 11–20 of 35 invoices', {exact: false})).toBeVisible();
		await expect(invoices.getByRole('listitem')).toHaveCount(10);
		await expect(page.getByRole('heading', {name: 'Invoices'})).toBeFocused();
		await expect(page.getByText('Showing 1–10 of 35 claims envelopes')).toBeVisible();

		await page.getByRole('navigation', {name: 'Claims envelopes pagination'}).getByRole('button', {name: 'Next page'}).click();
		await expect(page).toHaveURL(/claimsPage=2/);
		await expect(page).toHaveURL(/invoicesPage=2/);
		await expect(page.getByText('Showing 11–20 of 35 claims envelopes')).toBeVisible();
		await expect(claims.getByRole('listitem')).toHaveCount(10);
		await expect(page.getByText('Showing 11–20 of 35 invoices', {exact: false})).toBeVisible();

		await page.reload();
		await expect(page.getByText('Showing 11–20 of 35 invoices', {exact: false})).toBeVisible();
		await expect(page.getByText('Showing 11–20 of 35 claims envelopes')).toBeVisible();
	});

	test('status filter and sort reset invoices to page 1 and leave claims alone', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await openBilling(page);

		await page.getByRole('navigation', {name: 'Invoices pagination'}).getByRole('button', {name: 'Next page'}).click();
		await page.getByRole('navigation', {name: 'Claims envelopes pagination'}).getByRole('button', {name: 'Next page'}).click();
		await expect(page).toHaveURL(/invoicesPage=2/);

		await chooseSelectOption(page, 'Status', 'Overdue');
		await expect(page).toHaveURL(/invoicesStatus=overdue/);
		await expect(page).not.toHaveURL(/invoicesPage=/);
		await expect(page).toHaveURL(/claimsPage=2/);
		await expect(page.getByText('Showing 1–10 of 11 invoices', {exact: false})).toBeVisible();
		const invoices = page.getByRole('list', {name: 'Invoices'});
		await expect(invoices.getByText('Overdue', {exact: true})).toHaveCount(10);
		await expect(page.getByRole('navigation', {name: 'Invoices pagination'})).toBeVisible();

		await chooseSelectOption(page, 'Sort', 'Oldest issued first');
		await expect(page).toHaveURL(/invoicesSort=issued-asc/);
		await expect(page.getByText(/Showing 1–10 of 11 invoices/)).toContainText('oldest first');

		await page.getByRole('button', {name: 'Clear filters'}).click();
		await expect(page.getByText(/Showing 1–10 of 35 invoices/)).toBeVisible();
		await expect(page).toHaveURL(/claimsPage=2/);
	});

	test('fits 320 px without horizontal scroll', async ({page}) => {
		await page.setViewportSize({width: 320, height: 900});
		await signInAsPracticeAdmin(page);
		await page.getByRole('button', {name: 'Open navigation'}).click();
		await page.getByRole('dialog').getByRole('link', {name: 'Billing'}).click();
		await expect(page.getByRole('list', {name: 'Invoices'})).toBeVisible();
		await expect(page.getByText('Page 1 of 4').first()).toBeVisible();

		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(0);
	});

	test('claims pager shows numbered pages only when its card is wide enough', async ({page}) => {
		await page.setViewportSize({width: 1440, height: 1000});
		await signInAsPracticeAdmin(page);
		await page.goto('/dashboard/billing');
		await expect(page.getByRole('list', {name: 'Claims envelopes'})).toBeVisible();
		const claimsPager = page.getByRole('navigation', {name: 'Claims envelopes pagination'});
		await expect(claimsPager.getByRole('button', {name: 'Page 2'})).toBeVisible();

		await page.setViewportSize({width: 900, height: 1000});
		await expect(claimsPager.getByRole('button', {name: 'Page 2'})).toBeHidden();
		await expect(claimsPager.getByText('Page 1 of 4')).toBeVisible();
	});
});
