import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SimplePagination} from '@/components/ui/simple-pagination';

describe('SimplePagination', () => {
	it('exposes a named landmark and the shown range', () => {
		render(
			<SimplePagination
				label="Patients"
				page={2}
				hasNext
				range={{first: 11, last: 20}}
				onPageChange={vi.fn()}
			/>,
		);

		expect(screen.getByRole('navigation', {name: 'Patients pagination'})).toBeInTheDocument();
		expect(screen.getByTestId('pagination-status')).toHaveTextContent('Showing 11–20');
	});

	it('disables Previous on the first page and Next on the last', () => {
		const {rerender} = render(
			<SimplePagination label="Patients" page={1} hasNext range={{first: 1, last: 10}} onPageChange={vi.fn()} />,
		);
		expect(screen.getByRole('button', {name: 'Previous page'})).toBeDisabled();
		expect(screen.getByRole('button', {name: 'Next page'})).toBeEnabled();

		rerender(
			<SimplePagination
				label="Patients"
				page={3}
				hasNext={false}
				range={{first: 21, last: 24}}
				onPageChange={vi.fn()}
			/>,
		);
		expect(screen.getByRole('button', {name: 'Previous page'})).toBeEnabled();
		expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
	});

	it('moves to the previous and next page', async () => {
		const onPageChange = vi.fn();
		const user = userEvent.setup();
		render(
			<SimplePagination label="Patients" page={2} hasNext range={{first: 11, last: 20}} onPageChange={onPageChange} />,
		);

		await user.click(screen.getByRole('button', {name: 'Next page'}));
		await user.click(screen.getByRole('button', {name: 'Previous page'}));

		expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
		expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
	});

	it('disables both buttons while busy', () => {
		render(
			<SimplePagination
				label="Patients"
				page={2}
				hasNext
				disabled
				range={{first: 11, last: 20}}
				onPageChange={vi.fn()}
			/>,
		);
		expect(screen.getByRole('button', {name: 'Previous page'})).toBeDisabled();
		expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
	});
});
