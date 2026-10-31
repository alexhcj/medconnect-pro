import {useState} from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SelectField, type SelectFieldProps} from '@/components/ui/select-field';

const OPTIONS = [
	{value: 'female', label: 'Female'},
	{value: 'male', label: 'Male'},
	{value: 'non-binary', label: 'Non-binary'},
];

function Harness(props: Partial<SelectFieldProps> & {initial?: string; onValue?: (value: string) => void}) {
	const {initial = '', onValue, ...rest} = props;
	const [value, setValue] = useState(initial);
	return (
		<SelectField
			label="Gender"
			value={value}
			options={OPTIONS}
			placeholder="Select a gender"
			onChange={(next) => {
				setValue(next);
				onValue?.(next);
			}}
			{...rest}
		/>
	);
}

function trigger() {
	return screen.getByRole('button', {name: /Gender/});
}

describe('SelectField', () => {
	it('names the trigger from the visible label and shows the placeholder', () => {
		render(<Harness />);
		expect(trigger()).toHaveTextContent('Select a gender');
		expect(trigger()).toHaveAttribute('aria-haspopup', 'listbox');
		expect(trigger()).toHaveAttribute('aria-expanded', 'false');
	});

	it('shows the label of the selected value', () => {
		render(<Harness initial="male" />);
		expect(trigger()).toHaveTextContent('Male');
	});

	it('opens, selects an option with the mouse and reports its value', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<Harness onValue={onValue} />);

		await user.click(trigger());
		expect(trigger()).toHaveAttribute('aria-expanded', 'true');
		await user.click(screen.getByRole('option', {name: 'Non-binary'}));

		expect(onValue).toHaveBeenCalledWith('non-binary');
		expect(trigger()).toHaveTextContent('Non-binary');
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('lists the placeholder as an empty choice that clears the value', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<Harness initial="male" onValue={onValue} />);

		await user.click(trigger());
		await user.click(screen.getByRole('option', {name: 'Select a gender'}));

		expect(onValue).toHaveBeenCalledWith('');
	});

	it('works from the keyboard: opens with Enter, moves with arrows, selects with Enter', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<Harness initial="female" onValue={onValue} />);

		trigger().focus();
		await user.keyboard('{Enter}');
		expect(screen.getByRole('listbox')).toBeInTheDocument();
		await user.keyboard('{ArrowDown}{Enter}');

		expect(onValue).toHaveBeenCalledWith('male');
		expect(trigger()).toHaveFocus();
	});

	it('closes on Escape and returns focus to the trigger', async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.click(trigger());
		await user.keyboard('{Escape}');

		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		expect(trigger()).toHaveFocus();
	});

	// Type-ahead is covered in e2e: Headless UI reads option text through innerText, which jsdom lacks.

	it('marks the selected option', async () => {
		const user = userEvent.setup();
		render(<Harness initial="male" />);

		await user.click(trigger());

		expect(screen.getByRole('option', {name: 'Male'})).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('option', {name: 'Female'})).toHaveAttribute('aria-selected', 'false');
	});

	it('shows a value that is not in the option list as selected text', () => {
		render(<SelectField label="Action" value="legacy.event" options={[{value: '', label: 'All actions'}]} onChange={() => {}} />);
		expect(screen.getByRole('button', {name: /Action/})).toHaveTextContent('legacy.event');
	});

	it('shows an empty-value option such as "All statuses" as normal text, not a placeholder', () => {
		render(
			<SelectField
				label="Status"
				value=""
				options={[
					{value: '', label: 'All statuses'},
					{value: 'active', label: 'Active'},
				]}
				onChange={() => {}}
			/>,
		);
		const text = screen.getByText('All statuses');
		expect(text).not.toHaveClass('text-foreground-placeholder');
	});

	it('links the error text to the trigger and marks it invalid', () => {
		render(<Harness error="Choose a gender" />);
		expect(trigger()).toHaveAttribute('aria-invalid', 'true');
		const error = screen.getByRole('alert');
		expect(error).toHaveTextContent('Choose a gender');
		expect(trigger().getAttribute('aria-describedby')).toContain(error.id);
	});

	it('does not open when disabled', async () => {
		const user = userEvent.setup();
		render(<Harness disabled />);

		await user.click(trigger());

		expect(trigger()).toBeDisabled();
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('cannot select a disabled option', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(
			<Harness
				onValue={onValue}
				options={[...OPTIONS.slice(0, 2), {value: 'non-binary', label: 'Non-binary', disabled: true}]}
			/>,
		);

		await user.click(trigger());
		await user.click(screen.getByRole('option', {name: 'Non-binary'}));

		expect(onValue).not.toHaveBeenCalled();
	});

	it('hides the visible label with a class when asked, keeping it for screen readers', () => {
		render(<Harness labelClassName="md:sr-only" />);
		expect(screen.getByText('Gender')).toHaveClass('md:sr-only');
		expect(trigger()).toBeInTheDocument();
	});
});
