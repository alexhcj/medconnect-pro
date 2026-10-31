import {expect, type Locator, type Page} from '@playwright/test';

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The trigger of a design-system `SelectField` (FE-058) by its exact visible label. Its accessible
 * name is the label plus the shown value, so the label element is matched instead.
 */
export function selectField(page: Page, label: string): Locator {
	return page
		.locator('label')
		.filter({hasText: new RegExp(`^${escapeRegExp(label)}$`)})
		.locator('xpath=following-sibling::button[@aria-haspopup="listbox"][1]');
}

/** Opens a `SelectField` and picks the option with this visible name, for example "Non-binary". */
export async function chooseSelectOption(page: Page, label: string, option: string) {
	const trigger = selectField(page, label);
	await trigger.click();
	await page.getByRole('listbox').getByRole('option', {name: option, exact: true}).click();
	await expect(trigger).toHaveText(option);
}
