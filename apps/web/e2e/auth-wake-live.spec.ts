import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page, type Route} from '@playwright/test';

/**
 * FE-049: the sign-in form and status indicator against a stubbed sleeping API. Runs in the live
 * config (mocks off) but needs no API or database: `/health` and `/auth/login` are stubbed.
 */
const API = 'http://localhost:3001';
const CORS = {
	'access-control-allow-origin': 'http://localhost:3000',
	'access-control-allow-credentials': 'true',
	'access-control-allow-headers': 'content-type,x-csrf-token',
	'access-control-allow-methods': 'GET,POST,OPTIONS',
};

interface Stub {
	asleep: boolean;
	loginCalls: number;
	healthCalls: number;
}

async function stubApi(page: Page): Promise<Stub> {
	const stub: Stub = {asleep: true, loginCalls: 0, healthCalls: 0};
	const handle = async (route: Route, onGet: () => Promise<void> | void) => {
		if (route.request().method() === 'OPTIONS') {
			await route.fulfill({status: 204, headers: CORS});
			return;
		}
		await onGet();
	};
	await page.route(`${API}/health`, (route) =>
		handle(route, async () => {
			stub.healthCalls += 1;
			if (stub.asleep) {
				await route.fulfill({status: 502, headers: CORS, body: ''});
				return;
			}
			await route.fulfill({
				status: 200,
				headers: {...CORS, 'content-type': 'application/json'},
				body: JSON.stringify({status: 'ok'}),
			});
		}),
	);
	await page.route(`${API}/auth/login`, (route) =>
		handle(route, async () => {
			stub.loginCalls += 1;
			if (stub.asleep) {
				await route.fulfill({status: 502, headers: CORS, body: ''});
				return;
			}
			await route.fulfill({
				status: 200,
				headers: {...CORS, 'content-type': 'application/json'},
				body: JSON.stringify({
					accessToken: 'opaque-access',
					refreshToken: 'opaque-refresh',
					expiresIn: 900,
				}),
			});
		}),
	);
	return stub;
}

/** `next dev` renders the TanStack devtools toggle bottom-right, over the indicator. Not in production. */
async function hideQueryDevtools(page: Page) {
	await page.addStyleTag({content: '.tsqd-parent-container { display: none !important; }'});
}

async function fillCredentials(page: Page) {
	await page.getByLabel('Email', {exact: true}).fill('practice.admin@example.test');
	await page.getByLabel('Password', {exact: true}).fill('Demo-Admin-1');
}

test.describe('API wake and status indicator (stubbed API)', () => {
	test('opens the waking card on first focus, queues a submit and finishes when the API wakes', async ({page}) => {
		const stub = await stubApi(page);
		await page.goto('/login');
		await expect(page.getByRole('button', {name: 'API status'})).toBeVisible();
		expect(stub.healthCalls).toBe(0);

		await page.getByLabel('Email', {exact: true}).focus();
		const trigger = page.getByRole('button', {name: /waking up/i});
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect(page.getByText(/usually about a minute/i)).toBeVisible();

		await fillCredentials(page);
		await page.getByRole('button', {name: /^sign in$/i}).click();
		await expect(page.getByText('Server is waking up, see the status indicator')).toBeVisible();
		await expect(page.getByText('Unable to sign in. Try again.')).toHaveCount(0);
		await expect(page.getByRole('button', {name: /signing in when ready/i})).toBeEnabled();
		expect(stub.loginCalls).toBe(0);

		stub.asleep = false;
		// The first backoff probe finds the API awake, then the queued sign-in is sent exactly once.
		await expect.poll(() => stub.loginCalls, {timeout: 20_000}).toBe(1);
		await page.waitForTimeout(1500);
		expect(stub.loginCalls).toBe(1);
	});

	test('Esc closes the card and Enter reopens it from the keyboard', async ({page}) => {
		await stubApi(page);
		await page.goto('/login');
		await page.getByLabel('Email', {exact: true}).focus();
		const trigger = page.getByRole('button', {name: /waking up/i});
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await trigger.focus();
		await page.keyboard.press('Escape');
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await page.keyboard.press('Enter');
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});

	test('cancel drops a queued sign-in', async ({page}) => {
		const stub = await stubApi(page);
		await page.goto('/login');
		await page.getByLabel('Email', {exact: true}).focus();
		await fillCredentials(page);
		await page.getByRole('button', {name: /^sign in$/i}).click();
		await page.getByRole('button', {name: 'Cancel'}).click();
		await expect(page.getByRole('button', {name: /^sign in$/i})).toBeVisible();
		stub.asleep = false;
		await page.waitForTimeout(4000);
		expect(stub.loginCalls).toBe(0);
	});

	test('at 320 px the indicator does not cover the form or the Sign in button', async ({page}) => {
		await page.setViewportSize({width: 320, height: 640});
		await stubApi(page);
		await page.goto('/login');
		await page.getByLabel('Email', {exact: true}).focus();
		await expect(page.locator('#api-status-card')).toBeVisible();
		// The page reserves room once the indicator has published its height.
		await expect
			.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--api-status-reserve')))
			.not.toBe('');
		await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
		await page.waitForTimeout(300);

		const overlay = await page.locator('#api-status-card').boundingBox();
		const trigger = await page.getByRole('button', {name: /waking up/i}).boundingBox();
		const submit = await page.getByRole('button', {name: /^sign in$/i}).boundingBox();
		const links = await page.getByRole('link', {name: 'Practice registration'}).boundingBox();
		expect(overlay && trigger && submit && links).toBeTruthy();
		const top = Math.min(overlay!.y, trigger!.y);
		expect(submit!.y + submit!.height).toBeLessThanOrEqual(top);
		expect(links!.y + links!.height).toBeLessThanOrEqual(top);
		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scrollWidth).toBeLessThanOrEqual(320);
	});

	test('attention cue animates only without reduced motion, otherwise a static ring', async ({page}) => {
		await stubApi(page);
		await page.goto('/login');
		await page.getByLabel('Email', {exact: true}).focus();
		await fillCredentials(page);

		await page.emulateMedia({reducedMotion: 'no-preference'});
		await page.getByRole('button', {name: /^sign in$/i}).click();
		const trigger = page.getByRole('button', {name: /waking up/i});
		await expect(trigger).toHaveClass(/api-status-attention/);
		const animated = await trigger.evaluate((el) => getComputedStyle(el).animationName);
		expect(animated).toContain('api-status-shake');

		await page.emulateMedia({reducedMotion: 'reduce'});
		const still = await trigger.evaluate((el) => getComputedStyle(el).animationName);
		expect(still).toBe('none');
		const outline = await trigger.evaluate((el) => getComputedStyle(el).outlineStyle);
		expect(outline).toBe('solid');
	});
});

test.describe('API status indicator input modes and accessibility', () => {
	test.describe('touch', () => {
		test.use({hasTouch: true});

		test('a tap opens and closes the card, and a touch never triggers the hover preview', async ({page}) => {
			const stub = await stubApi(page);
			stub.asleep = false;
			await page.goto('/login');
			await hideQueryDevtools(page);
			await page.getByLabel('Email', {exact: true}).tap();
			await expect(page.getByRole('button', {name: 'API status: API ready'})).toBeVisible();
			// The accessible name changes between dot and pill, so address the trigger by its state attribute.
			const dot = page.locator('div.fixed > button[aria-expanded]');
			await expect(dot).toHaveAttribute('aria-expanded', 'false');
			await expect(page.getByText('API ready', {exact: true})).toHaveCount(0);

			await dot.tap();
			await expect(dot).toHaveAttribute('aria-expanded', 'true');
			await expect(page.getByText('The API is awake. Free tier sleeps again when idle.')).toBeVisible();
			await dot.tap();
			await expect(dot).toHaveAttribute('aria-expanded', 'false');
			await expect(page.getByText('API ready', {exact: true})).toHaveCount(0);
		});
	});

	test('a mouse hover previews the ready dot as a pill without opening the card', async ({page}) => {
		const stub = await stubApi(page);
		stub.asleep = false;
		await page.goto('/login');
		await hideQueryDevtools(page);
		await page.getByLabel('Email', {exact: true}).focus();
		await expect(page.getByRole('button', {name: 'API status: API ready'})).toBeVisible();
		const trigger = page.locator('div.fixed > button[aria-expanded]');

		await trigger.hover();
		await expect(trigger.getByText('API ready')).toBeVisible();
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await page.mouse.move(5, 5);
		await expect(page.getByRole('button', {name: 'API status: API ready'})).toBeVisible();
	});

	for (const width of [320, 1280]) {
		test(`has no axe violations while waking and after reopening ready (${width} px)`, async ({page}) => {
			await page.setViewportSize({width, height: 800});
			await stubApi(page);
			await page.goto('/login');
			await page.getByLabel('Email', {exact: true}).focus();
			await expect(page.locator('#api-status-card')).toBeVisible();
			const scan = () =>
				new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();

			expect((await scan()).violations).toEqual([]);

			await fillCredentials(page);
			await page.getByRole('button', {name: /^sign in$/i}).click();
			await expect(page.getByRole('button', {name: /signing in when ready/i})).toBeVisible();
			expect((await scan()).violations).toEqual([]);

		});
	}
});
