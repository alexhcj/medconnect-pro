import {render} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SelectField} from '@/components/admin/list-filter-fields';
import {chooseOption, getSelect, optionNames} from '@/test/select';

describe('SelectField', () => {
	it('shows option labels in place of raw values and reports the value', async () => {
		const onChange = vi.fn();
		const user = userEvent.setup();
		render(
			<SelectField
				label="Status"
				value="overdue"
				options={['issued', 'overdue']}
				optionLabels={{issued: 'Issued', overdue: 'Overdue'}}
				allLabel="All statuses"
				onChange={onChange}
			/>,
		);

		expect(getSelect('Status')).toHaveTextContent('Overdue');
		expect(await optionNames(user, 'Status')).toEqual(['All statuses', 'Issued', 'Overdue']);
		await chooseOption(user, 'Status', 'All statuses');
		expect(onChange).toHaveBeenCalledWith('');
	});

	it('falls back to the raw value when no label is given', async () => {
		const user = userEvent.setup();
		render(
			<SelectField label="Action" value="" options={['CREATE']} allLabel="All actions" onChange={vi.fn()} />,
		);

		expect(getSelect('Action')).toHaveTextContent('All actions');
		expect(await optionNames(user, 'Action')).toEqual(['All actions', 'CREATE']);
	});

	it('shows a URL value that is not in the curated list as selected', async () => {
		const user = userEvent.setup();
		render(
			<SelectField label="Action" value="legacy.event" options={['CREATE']} allLabel="All actions" onChange={vi.fn()} />,
		);

		expect(getSelect('Action')).toHaveTextContent('legacy.event');
		expect(await optionNames(user, 'Action')).toEqual(['All actions', 'legacy.event', 'CREATE']);
	});
});
