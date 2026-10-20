import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Pagination, pageItems} from '@/components/ui/pagination';

describe('pageItems', () => {
	it('lists every page when there are seven or fewer', () => {
		expect(pageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
	});

	it('collapses distant pages into ellipses', () => {
		expect(pageItems(2, 13)).toEqual([1, 2, 3, 'ellipsis-end', 13]);
		expect(pageItems(7, 13)).toEqual([1, 'ellipsis-start', 6, 7, 8, 'ellipsis-end', 13]);
		expect(pageItems(13, 13)).toEqual([1, 'ellipsis-start', 12, 13]);
	});
});

describe('Pagination', () => {
	it('exposes a named landmark, the current page and the page count', () => {
		render(<Pagination label="Audit events" page={2} total={312} onPageChange={vi.fn()} />);

		expect(screen.getByRole('navigation', {name: 'Audit events pagination'})).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Page 2'})).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('button', {name: 'Page 3'})).not.toHaveAttribute('aria-current');
		expect(screen.getByText('Page 2 of 13')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Page 13'})).toBeInTheDocument();
	});

	it('moves to the previous, next and chosen page', async () => {
		const onPageChange = vi.fn();
		const user = userEvent.setup();
		render(<Pagination label="Audit events" page={2} total={312} onPageChange={onPageChange} />);

		await user.click(screen.getByRole('button', {name: 'Next page'}));
		await user.click(screen.getByRole('button', {name: 'Previous page'}));
		await user.click(screen.getByRole('button', {name: 'Page 13'}));

		expect(onPageChange.mock.calls).toEqual([[3], [1], [13]]);
	});

	it('does not refetch the current page', async () => {
		const onPageChange = vi.fn();
		const user = userEvent.setup();
		render(<Pagination label="Users" page={2} total={312} onPageChange={onPageChange} />);

		await user.click(screen.getByRole('button', {name: 'Page 2'}));
		expect(onPageChange).not.toHaveBeenCalled();
	});

	it('disables Previous on the first page and Next on the last', () => {
		const {rerender} = render(
			<Pagination label="Users" page={1} total={312} onPageChange={vi.fn()} />,
		);
		expect(screen.getByRole('button', {name: 'Previous page'})).toBeDisabled();
		expect(screen.getByRole('button', {name: 'Next page'})).toBeEnabled();

		rerender(<Pagination label="Users" page={13} total={312} onPageChange={vi.fn()} />);
		expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
	});

	it('disables every control while a page is loading', () => {
		render(<Pagination label="Users" page={2} total={312} onPageChange={vi.fn()} disabled />);
		for (const button of screen.getAllByRole('button')) {
			expect(button).toBeDisabled();
		}
	});

	it('uses 44 px targets', () => {
		render(<Pagination label="Users" page={2} total={312} onPageChange={vi.fn()} />);
		expect(screen.getByRole('button', {name: 'Next page'})).toHaveClass('h-11');
		expect(screen.getByRole('button', {name: 'Page 3'})).toHaveClass('h-11', 'w-11');
	});
});
