import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {InvoiceList} from '@/components/billing/invoice-list';
import {chooseOption, getSelect} from '@/test/select';
import {Invoice} from '@/types/billing/invoice';

const {useInvoices, useListUrlState, setPage, setFilters} = vi.hoisted(() => ({
	useInvoices: vi.fn(),
	useListUrlState: vi.fn(),
	setPage: vi.fn(),
	setFilters: vi.fn(),
}));

vi.mock('@/lib/hooks/use-billing', () => ({
	useInvoices,
}));

vi.mock('@/lib/admin/use-list-url-state', () => ({
	useListUrlState,
}));

const sampleInvoice: Invoice = {
	id: 'demo-invoice-001',
	practiceId: 'demo-practice-001',
	patientId: 'demo-patient-001',
	patientName: 'Avery Carter',
	status: 'issued',
	amountCents: 15000,
	currency: 'USD',
	issuedAt: '2026-09-01T00:00:00.000Z',
	dueAt: '2026-09-15T00:00:00.000Z',
	lineItems: [{description: 'Office visit', amountCents: 15000}],
	synthetic: true,
};

function urlState(page = 1, filters: Record<string, string | undefined> = {}) {
	useListUrlState.mockReturnValue({page, filters, setPage, setFilters});
}

function mockInvoices(overrides: Record<string, unknown> = {}) {
	useInvoices.mockReturnValue({
		data: {items: [sampleInvoice], total: 1, hasMore: false},
		isPending: false,
		isError: false,
		isPlaceholderData: false,
		refetch: vi.fn(),
		...overrides,
	});
}

function pageOf(count: number, total: number) {
	return {
		items: Array.from({length: count}, (_, index) => ({
			...sampleInvoice,
			id: `demo-invoice-${index + 1}`,
		})),
		total,
		hasMore: total > count,
	};
}

describe('InvoiceList', () => {
	beforeEach(() => {
		setPage.mockClear();
		setFilters.mockClear();
		urlState();
	});

	it('renders invoice rows with amount, status, and a detail link', () => {
		mockInvoices();
		render(<InvoiceList />);

		const list = screen.getByRole('list', {name: 'Invoices'});
		expect(list).toHaveTextContent('Avery Carter');
		expect(list).toHaveTextContent('Issued');
		expect(list).toHaveTextContent('$150.00');
		expect(screen.getByRole('link', {name: 'View invoice demo-invoice-001 for Avery Carter'})).toHaveAttribute(
			'href',
			'/dashboard/billing/demo-invoice-001',
		);
	});

	it('colours each status while keeping its text label', () => {
		mockInvoices({
			data: {
				items: [
					{...sampleInvoice, id: 'demo-invoice-001', status: 'issued'},
					{...sampleInvoice, id: 'demo-invoice-002', status: 'paid'},
					{...sampleInvoice, id: 'demo-invoice-003', status: 'overdue'},
				],
				total: 3,
				hasMore: false,
			},
		});
		render(<InvoiceList />);

		const list = screen.getByRole('list', {name: 'Invoices'});
		expect(list).toHaveTextContent('Issued');
		expect(screen.getAllByText('Issued').find((node) => node.tagName === 'P')).toHaveClass(
			'text-foreground-secondary',
		);
		expect(screen.getAllByText('Paid').find((node) => node.tagName === 'P')).toHaveClass('text-success-strong');
		expect(screen.getAllByText('Overdue').find((node) => node.tagName === 'P')).toHaveClass('text-danger');
	});

	it('requests the page, status and sort from the URL', () => {
		urlState(2, {status: 'overdue', sort: 'issued-asc'});
		mockInvoices({data: pageOf(10, 60)});
		render(<InvoiceList />);

		expect(useInvoices).toHaveBeenLastCalledWith({page: 2, status: 'overdue', sort: 'issued-asc'});
		expect(getSelect('Status')).toHaveTextContent('Overdue');
		expect(getSelect('Sort')).toHaveTextContent('Oldest issued first');
	});

	it('ignores unknown status and sort values from the URL', () => {
		urlState(1, {status: 'void', sort: 'amount-desc'});
		mockInvoices();
		render(<InvoiceList />);

		expect(useInvoices).toHaveBeenLastCalledWith({page: 1, status: undefined, sort: undefined});
	});

	it('shows the range, total and sort order', () => {
		urlState(2);
		mockInvoices({data: pageOf(10, 35)});
		render(<InvoiceList />);

		expect(screen.getByText(/Showing 11–20 of 35 invoices/)).toHaveTextContent('newest first');
	});

	it('names oldest first when sorted ascending', () => {
		urlState(1, {sort: 'issued-asc'});
		mockInvoices();
		render(<InvoiceList />);

		expect(screen.getByText(/Showing 1–1 of 1 invoices/)).toHaveTextContent('oldest first');
	});

	it('changes the status filter and sort through the URL state, keeping the other value', async () => {
		urlState(3, {status: 'paid'});
		mockInvoices({data: pageOf(10, 80)});
		const user = userEvent.setup();
		render(<InvoiceList />);

		await chooseOption(user, 'Status', 'Overdue');
		expect(setFilters).toHaveBeenLastCalledWith({status: 'overdue', sort: undefined});

		await chooseOption(user, 'Sort', 'Oldest issued first');
		expect(setFilters).toHaveBeenLastCalledWith({status: 'paid', sort: 'issued-asc'});
		expect(setPage).not.toHaveBeenCalled();
	});

	it('clears filters', async () => {
		urlState(1, {status: 'paid'});
		mockInvoices();
		const user = userEvent.setup();
		render(<InvoiceList />);

		await user.click(screen.getByRole('button', {name: 'Clear filters'}));
		expect(setFilters).toHaveBeenCalledWith({});
	});

	it('pages with numbered controls and keeps the pager out of a single page', async () => {
		urlState(1);
		mockInvoices({data: pageOf(10, 60)});
		const user = userEvent.setup();
		const {rerender} = render(<InvoiceList />);

		expect(screen.getByRole('navigation', {name: 'Invoices pagination'})).toBeInTheDocument();
		await user.click(screen.getByRole('button', {name: 'Next page'}));
		expect(setPage).toHaveBeenCalledWith(2);

		mockInvoices({data: pageOf(10, 10)});
		rerender(<InvoiceList />);
		expect(screen.queryByRole('navigation', {name: 'Invoices pagination'})).not.toBeInTheDocument();
	});

	it('dims the previous page and disables paging while the next page loads', () => {
		urlState(2);
		mockInvoices({data: pageOf(10, 60), isPlaceholderData: true});
		render(<InvoiceList />);

		expect(screen.getByRole('list', {name: 'Invoices'})).toHaveAttribute('aria-busy', 'true');
		expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
	});

	it('shows a loading state with disabled filters', () => {
		mockInvoices({data: undefined, isPending: true});
		render(<InvoiceList />);

		expect(screen.getByText('Loading invoices')).toBeInTheDocument();
		expect(screen.getByLabelText('Status')).toBeDisabled();
		expect(screen.queryByRole('list', {name: 'Invoices'})).not.toBeInTheDocument();
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		mockInvoices({data: undefined, isError: true, refetch});
		const user = userEvent.setup();
		render(<InvoiceList />);

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load invoices.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(refetch).toHaveBeenCalledOnce();
	});

	it('shows an empty message and hides the filters when there are no invoices at all', () => {
		mockInvoices({data: {items: [], total: 0, hasMore: false}});
		render(<InvoiceList />);

		expect(screen.getByText('No invoices to display.')).toBeInTheDocument();
		expect(screen.queryByRole('group', {name: 'Invoice filters'})).not.toBeInTheDocument();
	});

	it('explains an empty filtered result and offers to clear the filters', async () => {
		urlState(1, {status: 'paid'});
		mockInvoices({data: {items: [], total: 0, hasMore: false}});
		const user = userEvent.setup();
		render(<InvoiceList />);

		expect(screen.getByText('No invoices match these filters.')).toBeInTheDocument();
		expect(screen.getByRole('group', {name: 'Invoice filters'})).toBeInTheDocument();
		await user.click(screen.getAllByRole('button', {name: 'Clear filters'})[1]);
		expect(setFilters).toHaveBeenCalledWith({});
	});

	it('offers a way back when the page is past the end', async () => {
		urlState(14);
		mockInvoices({data: {items: [], total: 312, hasMore: false}});
		const user = userEvent.setup();
		render(<InvoiceList />);

		expect(screen.getByText('Page 14 is past the end of the results (312 invoices).')).toBeInTheDocument();
		await user.click(screen.getByRole('button', {name: 'Back to first page'}));
		expect(setPage).toHaveBeenCalledWith(1);
	});

	it('gives the detail link a 44 px target', () => {
		mockInvoices();
		render(<InvoiceList />);

		expect(screen.getByRole('link', {name: /View invoice demo-invoice-001/})).toHaveClass('h-11');
	});
});
