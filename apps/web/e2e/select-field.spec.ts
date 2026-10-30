import AxeBuilder from '@axe-core/playwright';
import {expect, test, type Page} from '@playwright/test';
import {signInAsPracticeAdmin} from './helpers/mock-auth';
import {selectField} from './helpers/select-fields';

/** Every visible text, search, select, date and time control (not the icon buttons inside them). */
const CONTROLS =
	'input:not([type=checkbox]):not([type=radio]):not([type=hidden]), select, button[aria-haspopup=listbox]:not([id^=headlessui-combobox-button])';

async function controlHeights(page: Page) {
	return page.locator(CONTROLS).evaluateAll((elements) =>
		elements
			.filter((element) => (element as HTMLElement).offsetParent !== null)
			.map((element) => ({
				name: element.id || element.getAttribute('name') || element.tagName,
				height: Math.round(element.getBoundingClientRect().height),
			})),
	);
}

async function expectAllControls40(page: Page) {
	const heights = await controlHeights(page);
	expect(heights.length).toBeGreaterThan(0);
	expect(heights.filter((control) => control.height !== 40)).toEqual([]);
}

test.describe('Design-system select list (FE-058)', () => {
	test('is driven from the keyboard and returns focus on Escape', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await page.goto('/dashboard/patients/new');
		const gender = selectField(page, 'Gender');
		await expect(gender).toHaveText('Select a gender');

		await gender.focus();
		await page.keyboard.press('Enter');
		const list = page.getByRole('listbox');
		await expect(list).toBeVisible();
		await expect(gender).toHaveAttribute('aria-expanded', 'true');

		await page.keyboard.press('End');
		await expect(list.getByRole('option', {name: 'Non-binary'})).toHaveAttribute('data-focus', '');
		await page.keyboard.press('Home');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await expect(list).toBeHidden();
		await expect(gender).toHaveText('Female');
		await expect(gender).toBeFocused();

		await page.keyboard.press('Space');
		await expect(list).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(list).toBeHidden();
		await expect(gender).toBeFocused();

		await page.keyboard.press('Alt+ArrowDown');
		await expect(list).toBeVisible();
		await page.keyboard.type('mal');
		await page.keyboard.press('Enter');
		await expect(gender).toHaveText('Male');

		// A closed list never submits the form on Enter.
		await page.keyboard.press('Enter');
		await expect(list).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page).toHaveURL(/\/dashboard\/patients\/new$/);
	});

	test('has no axe violations with a list open', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await page.goto('/dashboard/patients/new');
		await selectField(page, 'Gender').click();
		await expect(page.getByRole('listbox')).toBeVisible();

		const results = await new AxeBuilder({page})
			.include('form')
			.include('[role="listbox"]')
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
			.analyze();
		expect(
			results.violations.map(
				(violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
			),
		).toEqual([]);
	});

	test('opens the role list outside the table so rows do not clip it', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await page.goto('/dashboard/admin');
		const trigger = selectField(page, 'Role for provider@example.test');
		await trigger.click();

		const list = page.getByRole('listbox');
		await expect(list).toBeVisible();
		expect(await list.evaluate((element) => element.closest('table') === null)).toBe(true);
		const [listBox, triggerBox] = [await list.boundingBox(), await trigger.boundingBox()];
		expect(listBox?.width).toBe(triggerBox?.width);
		const viewport = page.viewportSize();
		expect((listBox?.y ?? 0) + (listBox?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0);
		await expect(list.getByRole('option', {name: 'PATIENT'})).toBeInViewport();
	});

	test('keeps a URL filter value that is not in the curated list', async ({page}) => {
		await signInAsPracticeAdmin(page);
		await page.goto('/dashboard/admin?auditAction=legacy.unknown');
		const action = selectField(page, 'Action').first();
		await expect(action).toHaveText('legacy.unknown');
		await action.click();
		await expect(page.getByRole('listbox').getByRole('option', {name: 'legacy.unknown'})).toHaveAttribute(
			'aria-selected',
			'true',
		);
	});

	test('every input type is 40 px high on desktop', async ({page}) => {
		await page.goto('/login');
		await expectAllControls40(page);

		await signInAsPracticeAdmin(page);
		for (const path of ['/dashboard/patients', '/dashboard/patients/new', '/dashboard/appointments/new', '/dashboard/admin', '/dashboard/billing']) {
			await page.goto(path);
			await expect(page.locator(CONTROLS).first()).toBeVisible();
			expect(await page.locator('select').count()).toBe(0);
			await expectAllControls40(page);
		}
	});

	test.describe('at 320 px', () => {
		test.use({viewport: {width: 320, height: 720}});

		test('keeps 40 px controls, icon buttons inside them, and no sideways scroll', async ({page}) => {
			await signInAsPracticeAdmin(page);
			await page.goto('/dashboard/appointments/new');
			await expect(selectField(page, 'Patient')).toBeVisible();
			await expectAllControls40(page);

			const iconsInside = await page.locator('input + button').evaluateAll((buttons) =>
				buttons
					.filter((button) => (button as HTMLElement).offsetParent !== null)
					.map((button) => {
						const own = button.getBoundingClientRect();
						const field = (button.previousElementSibling as HTMLElement).getBoundingClientRect();
						return own.top >= field.top && own.bottom <= field.bottom;
					}),
			);
			expect(iconsInside.length).toBeGreaterThan(0);
			expect(iconsInside.every(Boolean)).toBe(true);
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

			await selectField(page, 'Patient').click();
			const list = page.getByRole('listbox');
			await expect(list).toBeVisible();
			const box = await list.boundingBox();
			expect((box?.x ?? -1) >= 0 && (box?.x ?? 0) + (box?.width ?? 0) <= 320).toBe(true);
			const optionHeight = await list.getByRole('option').first().evaluate((option) => option.getBoundingClientRect().height);
			expect(optionHeight).toBeGreaterThanOrEqual(44);
		});
	});
});
