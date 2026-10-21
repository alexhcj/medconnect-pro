import {render, screen} from '@testing-library/react';
import {SelectField} from '@/components/admin/list-filter-fields';

describe('SelectField', () => {
	it('shows option labels in place of raw values and keeps the value', () => {
		render(
			<SelectField
				label="Status"
				value="overdue"
				options={['issued', 'overdue']}
				optionLabels={{issued: 'Issued', overdue: 'Overdue'}}
				allLabel="All statuses"
				onChange={vi.fn()}
			/>,
		);

		expect(screen.getByRole('option', {name: 'Overdue'})).toHaveValue('overdue');
		expect(screen.getByRole('option', {name: 'All statuses'})).toHaveValue('');
		expect(screen.getByLabelText('Status')).toHaveValue('overdue');
	});

	it('falls back to the raw value when no label is given', () => {
		render(
			<SelectField label="Action" value="" options={['CREATE']} allLabel="All actions" onChange={vi.fn()} />,
		);

		expect(screen.getByRole('option', {name: 'CREATE'})).toBeInTheDocument();
	});
});
