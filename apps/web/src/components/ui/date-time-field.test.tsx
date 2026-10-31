import {useState} from 'react';
import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DateTimeField, type DateTimeFieldProps} from '@/components/ui/date-time-field';
import {TimeField} from '@/components/ui/time-field';

function Harness(props: Partial<DateTimeFieldProps> & {initial?: string; onValue?: (value: string) => void}) {
	const {initial = '', onValue, ...rest} = props;
	const [value, setValue] = useState(initial);
	return (
		<DateTimeField
			legend="Start"
			value={value}
			onChange={(next) => {
				setValue(next);
				onValue?.(next);
			}}
			{...rest}
		/>
	);
}

function TimeHarness({onValue, minTime}: {onValue?: (value: string) => void; minTime?: string}) {
	const [value, setValue] = useState('');
	return (
		<TimeField
			label="Start time"
			value={value}
			minTime={minTime}
			onChange={(next) => {
				setValue(next);
				onValue?.(next);
			}}
		/>
	);
}

describe('TimeField', () => {
	it('commits a typed time on blur as HH:mm and shows it as h:mm AM/PM', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<TimeHarness onValue={onValue} />);
		const input = screen.getByRole('combobox', {name: 'Start time'});

		await user.type(input, '7:30 pm');
		await user.tab();

		expect(onValue).toHaveBeenLastCalledWith('19:30');
		expect(input).toHaveValue('7:30 PM');
	});

	it('accepts shorthand such as 7p', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<TimeHarness onValue={onValue} />);

		await user.type(screen.getByRole('combobox', {name: 'Start time'}), '7p');
		await user.tab();

		expect(onValue).toHaveBeenLastCalledWith('19:00');
	});

	it('lists 15-minute steps and picks one with the keyboard', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<TimeHarness onValue={onValue} />);

		await user.click(screen.getByRole('combobox', {name: 'Start time'}));
		const list = await screen.findByRole('listbox');
		expect(within(list).getAllByRole('option')).toHaveLength(96);

		// The first option (12:00 AM) is active when the list opens; two steps down is 12:30 AM.
		await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
		expect(onValue).toHaveBeenLastCalledWith('00:30');
		expect(screen.getByRole('combobox', {name: 'Start time'})).toHaveValue('12:30 AM');
	});

	it('filters the list as you type', async () => {
		const user = userEvent.setup();
		render(<TimeHarness />);

		await user.type(screen.getByRole('combobox', {name: 'Start time'}), '7:');

		const options = within(await screen.findByRole('listbox')).getAllByRole('option');
		expect(options.map((option) => option.textContent)).toEqual([
			'7:00 AM',
			'7:15 AM',
			'7:30 AM',
			'7:45 AM',
			'7:00 PM',
			'7:15 PM',
			'7:30 PM',
			'7:45 PM',
		]);
	});

	it('disables times before minTime', async () => {
		const user = userEvent.setup();
		render(<TimeHarness minTime="19:00" />);

		await user.click(screen.getByRole('combobox', {name: 'Start time'}));
		const list = await screen.findByRole('listbox');

		expect(within(list).getByRole('option', {name: '6:45 PM'})).toHaveAttribute('aria-disabled', 'true');
		expect(within(list).getByRole('option', {name: '7:00 PM'})).not.toHaveAttribute('aria-disabled');
	});

	it('clears the value when the text is emptied', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<TimeHarness onValue={onValue} />);
		const input = screen.getByRole('combobox', {name: 'Start time'});

		await user.type(input, '7p');
		await user.tab();
		await user.clear(input);
		await user.tab();

		expect(onValue).toHaveBeenLastCalledWith('');
	});
});

describe('DateTimeField', () => {
	it('groups the date and time under one legend', () => {
		render(<Harness />);
		const group = screen.getByRole('group', {name: 'Start'});
		expect(within(group).getByLabelText('Start date')).toBeInTheDocument();
		expect(within(group).getByRole('combobox', {name: 'Start time'})).toBeInTheDocument();
	});

	it('shows a stored local value as MM/DD/YYYY and h:mm AM/PM', () => {
		render(<Harness initial="2026-08-10T19:30" />);
		expect(screen.getByLabelText('Start date')).toHaveValue('08/10/2026');
		expect(screen.getByRole('combobox', {name: 'Start time'})).toHaveValue('7:30 PM');
	});

	it('reports the local ISO string only once both halves are set', async () => {
		const onValue = vi.fn();
		const user = userEvent.setup();
		render(<Harness onValue={onValue} />);

		await user.type(screen.getByLabelText('Start date'), '08102026');
		expect(onValue).toHaveBeenLastCalledWith('');
		expect(screen.getByLabelText('Start date')).toHaveValue('08/10/2026');

		await user.type(screen.getByRole('combobox', {name: 'Start time'}), '7p');
		await user.tab();
		expect(onValue).toHaveBeenLastCalledWith('2026-08-10T19:00');
	});

	it('follows an outside change such as an end auto-fill', () => {
		const {rerender} = render(<DateTimeField legend="End" value="" onChange={() => {}} />);
		rerender(<DateTimeField legend="End" value="2026-08-10T19:30" onChange={() => {}} />);
		expect(screen.getByLabelText('End date')).toHaveValue('08/10/2026');
		expect(screen.getByRole('combobox', {name: 'End time'})).toHaveValue('7:30 PM');
	});

	it('labels the viewer time zone and spells it out in the hint', () => {
		render(<Harness initial="2026-08-10T19:30" />);
		const group = screen.getByRole('group', {name: 'Start'});
		expect(within(group).getByText(/MM\/DD\/YYYY · h:mm AM\/PM · .+/)).toBeInTheDocument();
		expect(group.getAttribute('aria-describedby')).toBeTruthy();
	});

	it('shows the form error as text, linked to the group', () => {
		render(<Harness initial="2026-08-10T19:30" error="End must be after start" />);
		const group = screen.getByRole('group', {name: 'Start'});
		const alert = screen.getByRole('alert');
		expect(alert).toHaveTextContent('End must be after start');
		expect(group.getAttribute('aria-describedby')).toBe(alert.id);
	});

	it('disables times before minValue on the same day only', async () => {
		const user = userEvent.setup();
		render(<Harness initial="2026-08-10T19:30" minValue="2026-08-10T19:00" />);

		await user.click(screen.getByRole('combobox', {name: 'Start time'}));
		const list = await screen.findByRole('listbox');
		expect(within(list).getByRole('option', {name: '6:45 PM'})).toHaveAttribute('aria-disabled', 'true');
	});

	it('flags a date before minValue as text', async () => {
		const user = userEvent.setup();
		render(<Harness minValue="2026-08-10T19:00" />);

		await user.type(screen.getByLabelText('Start date'), '08092026');

		expect(screen.getByRole('alert')).toHaveTextContent('Date must be on or after 08/10/2026');
	});

	it('disables the whole group', () => {
		render(<Harness initial="2026-08-10T19:30" disabled />);
		expect(screen.getByLabelText('Start date')).toBeDisabled();
		expect(screen.getByRole('combobox', {name: 'Start time'})).toBeDisabled();
	});
});
