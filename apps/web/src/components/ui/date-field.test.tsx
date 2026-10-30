import {useState} from 'react';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DateField, type DateFieldProps} from '@/components/ui/date-field';

function Harness(props: Partial<DateFieldProps> & {initial?: string; onValue?: (value: string) => void}) {
	const {initial = '', onValue, ...rest} = props;
	const [value, setValue] = useState(initial);
	return (
		<DateField
			label="Date of birth"
			value={value}
			onChange={(next) => {
				setValue(next);
				onValue?.(next);
			}}
			{...rest}
		/>
	);
}

function input() {
	return screen.getByLabelText('Date of birth') as HTMLInputElement;
}

describe('DateField', () => {
	it('links the label and the format hint to the input', () => {
		render(<Harness />);
		expect(input()).toHaveAttribute('aria-describedby');
		const hint = document.getElementById(input().getAttribute('aria-describedby') as string);
		expect(hint).toHaveTextContent('MM/DD/YYYY');
		expect(input()).toHaveAttribute('inputmode', 'numeric');
	});

	it('masks typed digits and reports YYYY-MM-DD', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<Harness onValue={onValue} />);

		await user.type(input(), '08101970');

		expect(input()).toHaveValue('08/10/1970');
		expect(onValue).toHaveBeenLastCalledWith('1970-08-10');
	});

	it('shows a stored value as MM/DD/YYYY', () => {
		render(<Harness initial="1991-03-04" />);
		expect(input()).toHaveValue('03/04/1991');
	});

	it('follows an outside change to the value', () => {
		const {rerender} = render(<DateField label="Date of birth" value="" onChange={() => {}} />);
		rerender(<DateField label="Date of birth" value="1991-03-04" onChange={() => {}} />);
		expect(input()).toHaveValue('03/04/1991');
	});

	it('keeps a half-typed date and says what is wrong on blur', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<Harness onValue={onValue} />);

		await user.type(input(), '08/1');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		await user.tab();

		expect(input()).toHaveValue('08/1');
		expect(screen.getByRole('alert')).toHaveTextContent('Enter a full date as MM/DD/YYYY');
		expect(input()).toHaveAttribute('aria-invalid', 'true');
		expect(input().getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
		expect(onValue).toHaveBeenLastCalledWith('');
	});

	it('rejects a date that does not exist as soon as it is complete', async () => {
		const user = userEvent.setup();
		render(<Harness />);

		await user.type(input(), '02301970');

		expect(screen.getByRole('alert')).toHaveTextContent('Enter a real date as MM/DD/YYYY');
	});

	it('reports a date outside min and max with the limit in the message', async () => {
		const user = userEvent.setup();
		render(<Harness max="2026-10-30" />);

		await user.type(input(), '11012026');

		expect(screen.getByRole('alert')).toHaveTextContent('Date must be on or before 10/30/2026');
	});

	it('shows the form error when typing is fine, and the typing error first otherwise', async () => {
		const user = userEvent.setup();
		const {rerender} = render(<DateField label="Date of birth" value="" onChange={() => {}} error="Date of birth is required" />);
		expect(screen.getByRole('alert')).toHaveTextContent('Date of birth is required');

		rerender(<Harness error="Date of birth is required" />);
		await user.type(input(), '0230');
		await user.tab();
		expect(screen.getByRole('alert')).toHaveTextContent('Enter a full date as MM/DD/YYYY');
	});

	it('names the calendar button with the selected date', () => {
		render(<Harness initial="2026-08-10" />);
		expect(
			screen.getByRole('button', {name: 'Choose date, selected date is August 10, 2026'}),
		).toBeInTheDocument();
	});

	it('names the calendar button plainly when empty', () => {
		render(<Harness />);
		expect(screen.getByRole('button', {name: 'Choose date'})).toBeInTheDocument();
	});

	it('opens a labelled dialog with a month grid and focuses the selected day', async () => {
		const user = userEvent.setup();
		render(<Harness initial="2026-08-10" />);

		await user.click(screen.getByRole('button', {name: /Choose date/}));

		const dialog = await screen.findByRole('dialog', {name: 'Choose date of birth'});
		const grid = within(dialog).getByRole('grid');
		expect(grid).toBeInTheDocument();
		const selected = within(grid).getByRole('button', {name: /August 10th, 2026|August 10, 2026/});
		expect(selected.closest('td')).toHaveAttribute('aria-selected', 'true');
		expect(selected).toHaveFocus();
		expect(within(dialog).getByRole('status')).toHaveTextContent('August 2026');
	});

	it('picks a day with the keyboard and returns focus to the calendar button', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<Harness initial="2026-08-10" onValue={onValue} />);
		const open = screen.getByRole('button', {name: /Choose date/});
		await user.click(open);
		await screen.findByRole('dialog');

		await user.keyboard('{ArrowRight}{Enter}');

		expect(onValue).toHaveBeenLastCalledWith('2026-08-11');
		expect(input()).toHaveValue('08/11/2026');
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.getByRole('button', {name: /Choose date/})).toHaveFocus();
	});

	it('moves by week, month and year with the keys the design documents', async () => {
		const user = userEvent.setup();
		render(<Harness initial="2026-08-10" />);
		await user.click(screen.getByRole('button', {name: /Choose date/}));
		const dialog = await screen.findByRole('dialog');

		await user.keyboard('{ArrowDown}');
		expect(document.activeElement).toHaveAccessibleName(/August 17/);
		await user.keyboard('{PageDown}');
		expect(document.activeElement).toHaveAccessibleName(/September 17/);
		await user.keyboard('{Shift>}{PageUp}{/Shift}');
		expect(document.activeElement).toHaveAccessibleName(/September 17.*2025/);
		await user.keyboard('{Home}');
		expect(document.activeElement).toHaveAccessibleName(/September 14.*2025/);
		await user.keyboard('{End}');
		expect(document.activeElement).toHaveAccessibleName(/September 20.*2025/);
		expect(within(dialog).getByRole('status')).toHaveTextContent('September 2025');
	});

	it('closes on Escape and returns focus to the calendar button', async () => {
		const user = userEvent.setup();
		render(<Harness initial="2026-08-10" />);
		await user.click(screen.getByRole('button', {name: /Choose date/}));
		await screen.findByRole('dialog');

		await user.keyboard('{Escape}');

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.getByRole('button', {name: /Choose date/})).toHaveFocus();
	});

	it('disables days outside min and max and keeps them unselectable', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<Harness initial="2026-08-10" min="2026-08-05" max="2026-08-20" onValue={onValue} />);
		await user.click(screen.getByRole('button', {name: /Choose date/}));
		const dialog = await screen.findByRole('dialog');

		const tooEarly = within(dialog).getByRole('button', {name: /August 4/});
		expect(tooEarly).toBeDisabled();
		await user.click(tooEarly);
		expect(onValue).not.toHaveBeenCalled();
		expect(within(dialog).getByRole('button', {name: /August 21/})).toBeDisabled();
	});

	it('offers Today, and Clear only when clearable', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		const {unmount} = render(<Harness initial="2026-08-10" onValue={onValue} />);
		await user.click(screen.getByRole('button', {name: /Choose date/}));
		const dialog = await screen.findByRole('dialog');
		expect(within(dialog).getByRole('button', {name: 'Today'})).toBeInTheDocument();
		expect(within(dialog).queryByRole('button', {name: 'Clear'})).not.toBeInTheDocument();
		unmount();

		render(<Harness initial="2026-08-10" clearable onValue={onValue} />);
		await user.click(screen.getByRole('button', {name: /Choose date/}));
		await user.click(await screen.findByRole('button', {name: 'Clear'}));
		expect(onValue).toHaveBeenLastCalledWith('');
		expect(input()).toHaveValue('');
	});

	it('disables Today when today is outside the allowed range', async () => {
		const user = userEvent.setup();
		render(<Harness initial="2020-01-10" max="2020-12-31" />);
		await user.click(screen.getByRole('button', {name: /Choose date/}));
		expect(await screen.findByRole('button', {name: 'Today'})).toBeDisabled();
	});

	it('disables the input and the calendar button together', () => {
		render(<Harness initial="2026-08-10" disabled />);
		expect(input()).toBeDisabled();
		expect(screen.getByRole('button', {name: /Choose date/})).toBeDisabled();
	});

	it('passes autoComplete only when asked', () => {
		const {rerender} = render(<DateField label="Date of birth" value="" onChange={() => {}} autoComplete="bday" />);
		expect(input()).toHaveAttribute('autocomplete', 'bday');
		rerender(<DateField label="Date of birth" value="" onChange={() => {}} />);
		expect(input()).not.toHaveAttribute('autocomplete');
	});

	it('never writes the value to the URL or the console', async () => {
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		const url = window.location.href;
		const user = userEvent.setup();
		render(<Harness />);
		await user.type(input(), '08101970');
		expect(window.location.href).toBe(url);
		expect(log).not.toHaveBeenCalled();
		log.mockRestore();
	});
});
