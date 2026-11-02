import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {render, screen} from '@testing-library/react';
import {OAuthProviderButton} from '@/components/auth/oauth-provider-button';
import {formControlClassName} from '@/components/forms/form-field-styles';
import {Button} from '@/components/ui/button';
import {DateField} from '@/components/ui/date-field';
import {DateTimeField} from '@/components/ui/date-time-field';
import {Input} from '@/components/ui/input';
import {SelectField} from '@/components/ui/select-field';
import {TimeField} from '@/components/ui/time-field';

/**
 * FE-061: every control boundary reads the same two tokens (`border-input`, `border-input-hover`)
 * and steps down to `border-border` when disabled. No per-component colour override.
 */
const here = dirname(fileURLToPath(import.meta.url));
const read = (relative: string) => readFileSync(resolve(here, relative), 'utf8');

const tokenClasses = ['border-input', 'hover:border-input-hover', 'disabled:border-border'];

function expectBorderTokens(element: Element | null) {
	expect(element).not.toBeNull();
	expect(element).toHaveClass(...tokenClasses);
	expect(element).not.toHaveClass('hover:border-border-strong');
}

describe('control borders (FE-061)', () => {
	it('Input and textarea share the control class with hover and disabled steps', () => {
		const {container} = render(
			<>
				<Input label="Email" disabled />
				<textarea aria-label="Notes" className={formControlClassName} />
			</>,
		);

		expectBorderTokens(container.querySelector('input'));
		expectBorderTokens(screen.getByLabelText('Notes'));
		expect(container.querySelector('input')).toBeDisabled();
	});

	it('SelectField trigger uses the tokens', () => {
		const {container} = render(
			<SelectField
				label="Appointment type"
				value="follow-up"
				onChange={() => {}}
				options={[{value: 'follow-up', label: 'Follow-up'}]}
				disabled
			/>,
		);

		expectBorderTokens(container.querySelector('button'));
		expect(container.querySelector('button')).toBeDisabled();
	});

	it('DateField, TimeField and DateTimeField inputs use the tokens', () => {
		const {container} = render(
			<>
				<DateField label="Date of birth" value="" onChange={() => {}} disabled />
				<TimeField label="Start time" value="" onChange={() => {}} disabled />
				<DateTimeField legend="Visit" value="" onChange={() => {}} disabled />
			</>,
		);

		const inputs = container.querySelectorAll('input');
		expect(inputs.length).toBeGreaterThanOrEqual(4);
		inputs.forEach((input) => {
			expectBorderTokens(input);
			expect(input).toBeDisabled();
		});
	});

	it('outline Button hovers to the darker border and steps down when disabled', () => {
		render(
			<Button variant="outline" disabled>
				Cancel
			</Button>,
		);

		expectBorderTokens(screen.getByRole('button', {name: 'Cancel'}));
	});

	it('OAuth provider button uses the tokens, and the unavailable state uses the quiet border', () => {
		const {rerender} = render(<OAuthProviderButton provider="google" available />);
		expectBorderTokens(screen.getByRole('button', {name: /Continue with Google/}));

		rerender(<OAuthProviderButton provider="google" available={false} />);
		const unavailable = screen.getByRole('button', {name: /Continue with Google/});
		expect(unavailable).toHaveClass('border-border');
		expect(unavailable).not.toHaveClass('border-input');
	});

	it.each([
		['session/concurrent-session-dialog.tsx'],
		['session/session-extension-modal.tsx'],
	])('%s has no hard-coded gray control borders', (file) => {
		const source = read(`../${file}`);

		expect(source).not.toMatch(/border-gray-[34]00/);
		expect(source).toContain('border-input');
	});

	it('session dialog checkbox and buttons use the token and hover step', () => {
		const dialog = read('../session/concurrent-session-dialog.tsx');
		const modal = read('../session/session-extension-modal.tsx');

		expect(dialog).toMatch(/type="checkbox"[\s\S]*?border-input/);
		expect(dialog).toContain('border border-input hover:border-input-hover disabled:border-border');
		expect(modal).toContain('border border-input hover:border-input-hover disabled:border-border');
	});
});
