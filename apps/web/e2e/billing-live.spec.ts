import {expect, test, type Page} from '@playwright/test';
import {ADMIN_STATE, mutationHeaders, nestApiBase, openDashboard} from './helpers/live-session';

const invoiceUuid = /\/dashboard\/billing\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function openBilling(page: Page) {
	await page.getByRole('button', {name: 'Open navigation'}).click();
	await page.getByRole('dialog').getByRole('link', {name: 'Billing'}).click();
	await expect(page).toHaveURL(/\/dashboard\/billing$/);
}

async function createThrowawayInvoice(page: Page): Promise<string> {
	const patientsResponse = await page.request.get(
		`${nestApiBase}/patients?q=Avery&status=active&sort=name-asc&page=1`,
	);
	expect(patientsResponse.ok()).toBeTruthy();
	const patientsBody = (await patientsResponse.json()) as {
		patients: Array<{id: string; firstName: string; lastName: string}>;
	};
	const avery = patientsBody.patients.find(
		(patient) => patient.firstName === 'Avery' && patient.lastName === 'Quinn',
	);
	expect(avery).toBeTruthy();

	const dueAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
	const created = await page.request.post(`${nestApiBase}/billing/invoices`, {
		headers: await mutationHeaders(page),
		data: {
			patientId: avery!.id,
			dueAt,
			lineItems: [{description: 'FE-031 e2e throwaway visit', amountCents: 4100}],
		},
	});
	expect(created.status()).toBe(201);
	const invoice = (await created.json()) as {id: string};
	expect(invoice.id).toMatch(/^[0-9a-f-]{36}$/i);
	return invoice.id;
}

test.describe('Live billing list and detail', () => {
	test.use({storageState: ADMIN_STATE});
	test.use({viewport: {width: 768, height: 1024}});

	test('shows seeded Avery Quinn invoices and opens UUID detail', async ({page}) => {
		await openDashboard(page);
		await openBilling(page);

		await expect(page.getByRole('heading', {level: 1, name: 'Billing'})).toBeVisible();
		await expect(page.getByText('Synthetic demo. Demo payments do not collect card numbers.')).toBeVisible();

		// Billing pages 10 at a time, newest first, and earlier runs leave paid $41 invoices on page 1.
		// Narrow with the same URL params the Status and Sort filters write instead of assuming page 1.
		await page.goto('/dashboard/billing?invoicesStatus=paid&invoicesSort=issued-asc');
		const paidRow = page
			.getByRole('list', {name: 'Invoices'})
			.locator('li')
			.filter({hasText: 'Avery Quinn'})
			.filter({hasText: '$80.00'});
		await expect(paidRow).toContainText('Paid');

		await page.goto('/dashboard/billing?invoicesStatus=overdue');
		const invoices = page.getByRole('list', {name: 'Invoices'});
		await expect(invoices).toContainText('Avery Quinn');
		await expect(invoices).toContainText('$150.00');

		await expect(page.getByRole('heading', {name: 'Payment boundary'})).toBeVisible();
		await expect(page.getByText(/Open an unpaid invoice to record a demo payment/)).toBeVisible();
		await expect(page.getByRole('button', {name: 'Record payment'})).toBeDisabled();
		await expect(page.getByRole('heading', {name: 'Claims envelopes'})).toBeVisible();
		await expect(page.getByText(/Labeled EDI 837 envelopes derived from visible invoices/)).toBeVisible();
		await expect(page.getByRole('list', {name: 'Claims envelopes'})).toContainText('Not submitted');
		await expect(page.getByRole('list', {name: 'Claims envelopes'})).toContainText('EDI 837 (labeled)');

		const overdueRow = invoices
			.locator('li')
			.filter({hasText: 'Avery Quinn'})
			.filter({hasText: '$150.00'});
		await expect(overdueRow).toContainText('Overdue');
		await overdueRow.getByRole('link', {name: /View invoice .* for Avery Quinn/}).click();

		await expect(page).toHaveURL(invoiceUuid);
		await expect(page).not.toHaveURL(/demo-invoice-/);
		await expect(page.getByRole('heading', {level: 1, name: 'Invoice'})).toBeVisible();
		await expect(page.getByText('Avery Quinn')).toBeVisible();
		await expect(page.getByText('Overdue')).toBeVisible();
		await expect(page.getByRole('list', {name: 'Line items'})).toContainText('Office visit');
		await expect(page.getByRole('heading', {name: 'Payment boundary'})).toBeVisible();
		await expect(page.getByRole('heading', {name: 'Claims envelopes'})).toBeVisible();
		await expect(page.getByRole('button', {name: 'Record payment'})).toBeEnabled();

		await page.getByRole('link', {name: 'Back to billing'}).click();
		await expect(page).toHaveURL(/\/dashboard\/billing$/);
		await expect(page.getByRole('list', {name: 'Invoices'})).toContainText('Avery Quinn');
	});

	test('records a demo payment on an API-created invoice', async ({page}) => {
		await openDashboard(page);
		const invoiceId = await createThrowawayInvoice(page);

		await page.goto(`/dashboard/billing/${invoiceId}`);
		await expect(page).toHaveURL(new RegExp(`/dashboard/billing/${invoiceId}$`));
		await expect(page.getByRole('list', {name: 'Line items'})).toContainText('$41.00');
		await expect(page.getByRole('button', {name: 'Record payment'})).toBeEnabled();
		await page.getByRole('button', {name: 'Record payment'}).click();

		const dialog = page.getByRole('dialog', {name: 'Record payment'});
		await expect(dialog).toBeVisible();
		await expect(dialog.getByLabel(/card/i)).toHaveCount(0);
		await dialog.getByRole('radio', {name: 'ACH (demo)'}).click();
		await dialog.getByRole('button', {name: 'Confirm payment'}).click();

		await expect(page.getByText(/Processor ref/)).toBeVisible();
		await expect(page.getByText(/demo_/)).toBeVisible();
		await expect(page.getByText('This invoice is already paid. Hosted Stripe is not connected.')).toBeVisible();
		await expect(page.getByRole('button', {name: 'Record payment'})).toBeDisabled();
	});
});
