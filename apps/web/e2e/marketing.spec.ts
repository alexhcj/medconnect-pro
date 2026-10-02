import {expect, test} from '@playwright/test';

test.describe('Marketing public navigation', () => {
	test('navigates marketing pages and the existing mock login', async ({page}) => {
		await page.goto('/');

		const primaryNav = page.getByRole('navigation', {name: 'Primary'});
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: 'Connected care workflows for the modern practice',
			}),
		).toBeVisible();
		await expect(page.getByRole('heading', {level: 2, name: 'Product UI'})).toBeVisible();
		await expect(page.getByRole('region', {name: 'Product screens'})).toBeVisible();
		await expect(page.getByAltText('Patients directory with synthetic demo records')).toBeVisible();
		await expect(page.getByText('Placeholder until FE-023')).toHaveCount(0);
		await expect(page).toHaveTitle(/Home/);
		await expect(page.getByRole('banner')).toBeVisible();
		await expect(primaryNav).toBeVisible();
		await expect(page.getByRole('contentinfo')).toBeVisible();

		await primaryNav.getByRole('link', {name: 'Platform'}).click();
		await expect(page).toHaveURL(/\/platform$/);
		await expect(
			page.getByRole('heading', {level: 1, name: 'Practice modules in one platform'}),
		).toBeVisible();
		await expect(page).toHaveTitle(/Platform/);

		await primaryNav.getByRole('link', {name: 'Security'}).click();
		await expect(page).toHaveURL(/\/security$/);
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: 'Security-focused architecture, not a certified production system',
			}),
		).toBeVisible();
		await expect(page).toHaveTitle(/Security/);

		await primaryNav.getByRole('link', {name: 'About'}).click();
		await expect(page).toHaveURL(/\/about$/);
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: 'A portfolio demonstration of a multi-tenant healthcare SaaS',
			}),
		).toBeVisible();
		await expect(page).toHaveTitle(/About/);

		await primaryNav.getByRole('link', {name: 'Demo'}).click();
		await expect(page).toHaveURL(/\/demo$/);
		await expect(
			page.getByRole('heading', {level: 1, name: 'Explore the demo with mock identity'}),
		).toBeVisible();
		await expect(page).toHaveTitle(/Demo/);

		await page.getByRole('link', {name: 'Sign in to the demo'}).first().click();
		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Sign in'})).toBeVisible();
		await expect(page.getByRole('note')).toContainText('mock identity provider');
	});

	test('homepage CTAs reach platform and demo login', async ({page}) => {
		await page.goto('/');

		await page.getByRole('link', {name: 'Explore the platform'}).click();
		await expect(page).toHaveURL(/\/platform$/);
		await expect(
			page.getByRole('heading', {level: 1, name: 'Practice modules in one platform'}),
		).toBeVisible();

		await page.goto('/');
		await page.getByRole('link', {name: 'Go to demo'}).click();
		await expect(page).toHaveURL(/\/demo$/);
		await expect(
			page.getByRole('heading', {level: 1, name: 'Explore the demo with mock identity'}),
		).toBeVisible();

		await page.getByRole('link', {name: 'Sign in to the demo'}).first().click();
		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByRole('heading', {level: 1, name: 'Sign in'})).toBeVisible();
	});

	test('security, about, and demo copy does not over-claim', async ({page}) => {
		const routes = ['/security', '/about', '/demo'] as const;

		for (const route of routes) {
			await page.goto(route);
			await expect(page.getByText(/HIPAA compliant/i)).toHaveCount(0);
			await expect(page.getByText(/live video visits/i)).toHaveCount(0);
			await expect(page.getByText(/accept payments/i)).toHaveCount(0);
		}

		await page.goto('/demo');
		const signInLinks = page.getByRole('link', {name: 'Sign in to the demo'});
		await expect(signInLinks).toHaveCount(2);
		await expect(signInLinks.nth(0)).toHaveAttribute('href', '/login');
		await expect(signInLinks.nth(1)).toHaveAttribute('href', '/login');
	});

	test('platform overview exposes sitemap module links', async ({page}) => {
		await page.goto('/platform');

		const moduleHrefs = [
			'/platform/patient-management',
			'/platform/appointments',
			'/platform/telehealth',
			'/platform/billing',
			'/platform/analytics',
			'/platform/administration',
		];

		for (const href of moduleHrefs) {
			await expect(page.getByRole('link', {name: href})).toHaveAttribute('href', href);
		}

		await page.getByRole('link', {name: '/platform/patient-management'}).click();
		await expect(page).toHaveURL(/\/platform\/patient-management$/);
	});

	test('platform overview reaches each feature page', async ({page}) => {
		const featurePages = [
			{
				href: '/platform/patient-management',
				heading: 'Patient records for the practice',
			},
			{
				href: '/platform/appointments',
				heading: 'Calendar, appointments, and availability',
			},
			{
				href: '/platform/telehealth',
				heading: 'Appointment-linked virtual-visit workflow',
			},
			{
				href: '/platform/billing',
				heading: 'Invoice list and detail',
			},
			{
				href: '/platform/analytics',
				heading: 'Dashboard overview as it exists',
			},
			{
				href: '/platform/administration',
				heading: 'Users and audit viewer',
			},
		];

		for (const featurePage of featurePages) {
			await page.goto('/platform');
			await page.getByRole('link', {name: featurePage.href}).click();
			await expect(page).toHaveURL(new RegExp(`${featurePage.href}$`));
			await expect(
				page.getByRole('heading', {level: 1, name: featurePage.heading}),
			).toBeVisible();
		}
	});
});
