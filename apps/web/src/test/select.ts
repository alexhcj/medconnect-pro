import {screen, within} from '@testing-library/react';
import type {UserEvent} from '@testing-library/user-event';

/**
 * Test helpers for the design-system `SelectField` (FE-058). The trigger is a listbox button whose
 * accessible name is the label plus the shown value, so it is found by its exact label instead.
 */
export function getSelect(label: string): HTMLButtonElement {
	const matches = screen
		.getAllByRole('button')
		.filter((button) => button.getAttribute('aria-haspopup') === 'listbox')
		.filter((button) => {
			const labelId = (button.getAttribute('aria-labelledby') ?? '').split(' ')[0];
			return document.getElementById(labelId)?.textContent === label;
		});
	if (matches.length !== 1) {
		throw new Error(`Expected one select labelled "${label}", found ${matches.length}`);
	}
	return matches[0] as HTMLButtonElement;
}

export function querySelect(label: string): HTMLButtonElement | null {
	try {
		return getSelect(label);
	} catch {
		return null;
	}
}

/** Opens the select and clicks the option with this visible name. */
export async function chooseOption(user: UserEvent, label: string, option: string) {
	await user.click(getSelect(label));
	await user.click(within(screen.getByRole('listbox')).getByRole('option', {name: option}));
}

/** Opens the select and returns its option names, then closes it again. */
export async function optionNames(user: UserEvent, label: string): Promise<string[]> {
	await user.click(getSelect(label));
	const names = within(screen.getByRole('listbox'))
		.getAllByRole('option')
		.map((option) => option.textContent ?? '');
	await user.keyboard('{Escape}');
	return names;
}
