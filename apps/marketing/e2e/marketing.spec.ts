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
		await expect(page).toHaveURL(/\/platform\/?$/);
		await expect(
			page.getByRole('heading', {level: 1, name: 'Practice modules in one platform'}),
		).toBeVisible();
		await expect(page).toHaveTitle(/Platform/);

		await primaryNav.getByRole('link', {name: 'Security'}).click();
		await expect(page).toHaveURL(/\/security\/?$/);
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: 'Security-focused architecture, not a certified production system',
			}),
		).toBeVisible();
		await expect(page).toHaveTitle(/Security/);

		await primaryNav.getByRole('link', {name: 'About'}).click();
		await expect(page).toHaveURL(/\/about\/?$/);
		await expect(
			page.getByRole('heading', {
				level: 1,
				name: 'A portfolio demonstration of a multi-tenant healthcare SaaS',
			}),
		).toBeVisible();
		await expect(page).toHaveTitle(/About/);

		await primaryNav.getByRole('link', {name: 'Architecture'}).click();
		await expect(page).toHaveURL(/\/architecture\/?$/);
		await expect(
			page.getByRole('heading', {level: 1, name: 'How MedConnect Pro fits together'}),
		).toBeVisible();
		await expect(page).toHaveTitle(/Architecture/);
		await expect(primaryNav.getByRole('link', {name: 'Architecture'})).toHaveAttribute(
			'aria-current',
			'page',
		);

		await primaryNav.getByRole('link', {name: 'Demo'}).click();
		await expect(page).toHaveURL(/\/demo\/?$/);
		await expect(
			page.getByRole('heading', {level: 1, name: 'Explore the demo with mock identity'}),
		).toBeVisible();
		await expect(page).toHaveTitle(/Demo/);

		await expect(page.getByRole('link', {name: 'Sign in to the demo'}).first()).toHaveAttribute(
			'href',
			'http://localhost:3000/login',
		);
	});

	test('homepage CTAs reach platform and demo login', async ({page}) => {
		await page.goto('/');

		await page.getByRole('link', {name: 'Explore the platform'}).click();
		await expect(page).toHaveURL(/\/platform\/?$/);
		await expect(
			page.getByRole('heading', {level: 1, name: 'Practice modules in one platform'}),
		).toBeVisible();

		await page.goto('/');
		await page.getByRole('link', {name: 'Go to demo'}).click();
		await expect(page).toHaveURL(/\/demo\/?$/);
		await expect(
			page.getByRole('heading', {level: 1, name: 'Explore the demo with mock identity'}),
		).toBeVisible();

		await expect(page.getByRole('link', {name: 'Sign in to the demo'}).first()).toHaveAttribute(
			'href',
			'http://localhost:3000/login',
		);
	});

	test('security, about, architecture, and demo copy does not over-claim', async ({page}) => {
		const routes = ['/security', '/about', '/architecture', '/demo'] as const;

		for (const route of routes) {
			await page.goto(route);
			await expect(page.getByText(/HIPAA compliant/i)).toHaveCount(0);
			await expect(page.getByText(/live video visits/i)).toHaveCount(0);
			await expect(page.getByText(/accept payments/i)).toHaveCount(0);
		}

		await page.goto('/demo');
		const signInLinks = page.getByRole('link', {name: 'Sign in to the demo'});
		await expect(signInLinks).toHaveCount(2);
		await expect(signInLinks.nth(0)).toHaveAttribute('href', 'http://localhost:3000/login');
		await expect(signInLinks.nth(1)).toHaveAttribute('href', 'http://localhost:3000/login');
	});

	test('About, Security and the footer link into /architecture', async ({page}) => {
		const heading = page.getByRole('heading', {level: 1, name: 'How MedConnect Pro fits together'});
		const detail = page.locator('#architecture-detail');

		await page.goto('/about');
		await page.getByRole('link', {name: /View architecture/}).click();
		await expect(page).toHaveURL(/\/architecture\/?$/);
		await expect(heading).toBeVisible();

		await page.goto('/security');
		await page.getByRole('link', {name: "Where it's enforced: Tenant isolation"}).click();
		await expect(page).toHaveURL(/\/architecture\/?#database$/);
		await expect(detail.getByRole('heading', {level: 3})).toHaveText('Database');
		await expect(page.getByRole('button', {name: /Database/, pressed: true})).toBeVisible();

		await page.goto('/');
		await page
			.getByRole('navigation', {name: 'Footer'})
			.getByRole('link', {name: 'Architecture'})
			.click();
		await expect(page).toHaveURL(/\/architecture\/?$/);
		await expect(heading).toBeVisible();
	});

	test('architecture nodes open by keyboard', async ({page}) => {
		await page.goto('/architecture');
		const detail = page.locator('#architecture-detail');
		await expect(detail.getByRole('heading', {level: 3})).toHaveText('API');

		await page.getByRole('button', {name: /Sign-in/}).focus();
		await page.keyboard.press('Enter');
		await expect(detail.getByRole('heading', {level: 3})).toHaveText('Sign-in');
		await expect(detail).toContainText('not production OAuth');

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
			await expect(page.getByRole('link', {name: href})).toHaveAttribute(
				'href',
				new RegExp(`^${href}/?$`),
			);
		}

		await page.getByRole('link', {name: '/platform/patient-management'}).click();
		await expect(page).toHaveURL(/\/platform\/patient-management\/?$/);
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
				heading: 'Users, roles, and audit viewer',
			},
		];

		for (const featurePage of featurePages) {
			await page.goto('/platform');
			await page.getByRole('link', {name: featurePage.href}).click();
			await expect(page).toHaveURL(new RegExp(`${featurePage.href}/?$`));
			await expect(
				page.getByRole('heading', {level: 1, name: featurePage.heading}),
			).toBeVisible();
		}
	});
});

test.describe('Marketing architecture on a touch phone', () => {
	test.use({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true});

	test('the list replaces the map and nodes open by tap', async ({page}) => {
		await page.goto('/architecture');

		await expect(page.getByRole('img', {name: /MedConnect Pro system map/})).toBeHidden();
		const list = page.getByRole('list', {name: 'Planned — not shipped'});
		await expect(list).toBeVisible();
		const cache = list.getByRole('button', {name: /Cache and queues/});
		await cache.tap();
		await expect(cache).toHaveAttribute('aria-expanded', 'true');
		await expect(list).toContainText('rate limits use PostgreSQL today');
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
	});
});
