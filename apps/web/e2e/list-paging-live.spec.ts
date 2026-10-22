import {expect, test, type Locator, type Page} from '@playwright/test';
import {ADMIN_STATE} from './helpers/live-session';

// QA-009: every M19 list must reach a second page on the live stack. These assert behaviour that
// still holds as runs add rows (page 2 exists, is non-empty, the indicator and URL follow, Previous
// returns), never seeded counts or specific rows. If a seed change drops a list below one page, the
// Next-enabled check fails loudly instead of skipping.
// At 390 px both pagers show their text indicator ("Page N of M", "· Page N"), not numbered buttons.

interface PagedList {
	route: string;
	/** Accessible name of the pagination landmark. */
	nav: string;
	/** URL query key that holds the page. */
	param: string;
	/** Row locator that excludes header rows. */
	rows: (page: Page) => Locator;
	/** Text the indicator shows for a page. */
	indicator: (nav: Locator, pageNumber: number) => Locator;
}

const ofPages = (nav: Locator, pageNumber: number) => nav.getByText(new RegExp(`^Page ${pageNumber} of \\d+$`));

const tableRows = (name: string) => (page: Page) =>
	page.getByRole('table', {name}).getByRole('row').filter({hasNot: page.getByRole('columnheader')});

const LISTS: Record<string, PagedList> = {
	patients: {
		route: '/dashboard/patients',
		nav: 'Patients pagination',
		param: 'patientsPage',
		rows: (page) => page.getByRole('list', {name: 'Patients'}).getByRole('listitem'),
		indicator: (nav, pageNumber) => nav.getByTestId('pagination-status').filter({hasText: `Page ${pageNumber}`}),
	},
	invoices: {
		route: '/dashboard/billing',
		nav: 'Invoices pagination',
		param: 'invoicesPage',
		rows: (page) => page.getByRole('list', {name: 'Invoices'}).getByRole('listitem'),
		indicator: ofPages,
	},
	claims: {
		route: '/dashboard/billing',
		nav: 'Claims envelopes pagination',
		param: 'claimsPage',
		rows: (page) => page.getByRole('list', {name: 'Claims envelopes'}).getByRole('listitem'),
		indicator: ofPages,
	},
	'audit events': {
		route: '/dashboard/admin',
		nav: 'Audit events pagination',
		param: 'auditPage',
		rows: tableRows('Audit events'),
		indicator: ofPages,
	},
	'security events': {
		route: '/dashboard/admin',
		nav: 'Security events pagination',
		param: 'securityPage',
		rows: tableRows('Security events'),
		indicator: ofPages,
	},
	'practice users': {
		route: '/dashboard/admin',
		nav: 'Practice users pagination',
		param: 'usersPage',
		rows: tableRows('Practice users'),
		indicator: ofPages,
	},
};

test.describe('Live list paging', () => {
	test.use({storageState: ADMIN_STATE});
	test.use({viewport: {width: 390, height: 844}});

	for (const [name, list] of Object.entries(LISTS)) {
		test(`${name} reach page 2 and back`, async ({page}) => {
			await page.goto(list.route);

			const nav = page.getByRole('navigation', {name: list.nav});
			const next = nav.getByRole('button', {name: 'Next page'});
			const previous = nav.getByRole('button', {name: 'Previous page'});
			const urlHasPage = new RegExp(`[?&]${list.param}=`);

			await expect(list.indicator(nav, 1)).toBeVisible();
			await expect(previous).toBeDisabled();
			await expect(list.rows(page).first()).toBeVisible();
			await expect(next).toBeEnabled();

			await next.click();
			await expect(page).toHaveURL(new RegExp(`[?&]${list.param}=2(&|$)`));
			await expect(list.indicator(nav, 2)).toBeVisible();
			await expect(list.rows(page).first()).toBeVisible();

			await previous.click();
			await expect(page).not.toHaveURL(urlHasPage);
			await expect(list.indicator(nav, 1)).toBeVisible();
			await expect(list.rows(page).first()).toBeVisible();
		});
	}
});
