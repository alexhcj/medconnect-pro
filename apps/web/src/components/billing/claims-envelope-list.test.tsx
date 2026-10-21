import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ClaimsEnvelopeList} from '@/components/billing/claims-envelope-list';
import {ApiError} from '@/lib/api/http';
import type {Claim} from '@/types/billing/claim';

const {useClaims, useListUrlState, setPage} = vi.hoisted(() => ({
	useClaims: vi.fn(),
	useListUrlState: vi.fn(),
	setPage: vi.fn(),
}));

vi.mock('@/lib/hooks/use-billing', () => ({
	useClaims,
}));

vi.mock('@/lib/admin/use-list-url-state', () => ({
	useListUrlState,
}));

const envelope: Claim = {
	id: 'demo-invoice-001',
	invoiceId: 'demo-invoice-001',
	status: 'not_submitted',
	processor: 'edi837',
	synthetic: true,
};

function mockClaims(overrides: Record<string, unknown> = {}) {
	useClaims.mockReturnValue({
		data: {items: [envelope], total: 1, hasMore: false},
		isPending: false,
		isError: false,
		isPlaceholderData: false,
		refetch: vi.fn(),
		...overrides,
	});
}

function pageOf(count: number, total: number) {
	return {
		items: Array.from({length: count}, (_, index) => ({...envelope, id: `claim-${index}`})),
		total,
		hasMore: total > count,
	};
}

describe('ClaimsEnvelopeList', () => {
	beforeEach(() => {
		setPage.mockClear();
		useListUrlState.mockReturnValue({page: 1, filters: {}, setPage, setFilters: vi.fn()});
	});

	it('renders labeled envelopes from visible invoices', () => {
		mockClaims();
		render(<ClaimsEnvelopeList />);

		expect(
			screen.getByText(/Labeled EDI 837 envelopes derived from visible invoices/),
		).toBeInTheDocument();
		expect(screen.getByText(/Not claim submission, X12, or denial workflow/)).toBeInTheDocument();
		expect(screen.getByRole('list', {name: 'Claims envelopes'})).toHaveTextContent('demo-invoice-001');
		expect(screen.getByText('Not submitted')).toBeInTheDocument();
		expect(screen.getByText('EDI 837 (labeled)')).toBeInTheDocument();
		expect(screen.getByText('Synthetic')).toBeInTheDocument();
		expect(screen.queryByText(/accept payments/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/X12 payload/i)).not.toBeInTheDocument();
	});

	it('pages on its own claims URL state and passes the page and enabled flag to the query', () => {
		useListUrlState.mockReturnValue({page: 3, filters: {}, setPage, setFilters: vi.fn()});
		mockClaims({data: pageOf(10, 80)});
		render(<ClaimsEnvelopeList enabled={false} />);

		expect(useListUrlState).toHaveBeenCalledWith('claims', expect.anything());
		expect(useClaims).toHaveBeenLastCalledWith({page: 3}, false);
	});

	it('shows the range and total', () => {
		useListUrlState.mockReturnValue({page: 2, filters: {}, setPage, setFilters: vi.fn()});
		mockClaims({data: pageOf(10, 35)});
		render(<ClaimsEnvelopeList />);

		expect(screen.getByText('Showing 11–20 of 35 claims envelopes')).toBeInTheDocument();
	});

	it('pages with a container-sized pager and hides it on a single page', async () => {
		mockClaims({data: pageOf(10, 60)});
		const user = userEvent.setup();
		const {rerender} = render(<ClaimsEnvelopeList />);

		expect(screen.getByRole('navigation', {name: 'Claims envelopes pagination'})).toBeInTheDocument();
		expect(screen.getByText('Page 1 of 6')).toHaveClass('@lg:hidden');
		await user.click(screen.getByRole('button', {name: 'Next page'}));
		expect(setPage).toHaveBeenCalledWith(2);

		mockClaims({data: pageOf(10, 10)});
		rerender(<ClaimsEnvelopeList />);
		expect(screen.queryByRole('navigation', {name: 'Claims envelopes pagination'})).not.toBeInTheDocument();
	});

	it('dims the previous page and disables paging while the next page loads', () => {
		mockClaims({data: pageOf(10, 60), isPlaceholderData: true});
		render(<ClaimsEnvelopeList />);

		expect(screen.getByRole('list', {name: 'Claims envelopes'})).toHaveAttribute('aria-busy', 'true');
		expect(screen.getByRole('button', {name: 'Next page'})).toBeDisabled();
	});

	it('shows an empty state', () => {
		mockClaims({data: {items: [], total: 0, hasMore: false}});
		render(<ClaimsEnvelopeList />);

		expect(screen.getByText('No claims envelopes for visible invoices.')).toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Claims envelopes'})).not.toBeInTheDocument();
	});

	it('offers a way back when the page is past the end', async () => {
		useListUrlState.mockReturnValue({page: 14, filters: {}, setPage, setFilters: vi.fn()});
		mockClaims({data: {items: [], total: 312, hasMore: false}});
		const user = userEvent.setup();
		render(<ClaimsEnvelopeList />);

		expect(
			screen.getByText('Page 14 is past the end of the results (312 claims envelopes).'),
		).toBeInTheDocument();
		await user.click(screen.getByRole('button', {name: 'Back to first page'}));
		expect(setPage).toHaveBeenCalledWith(1);
	});

	it('shows a loading state', () => {
		mockClaims({data: undefined, isPending: true});
		render(<ClaimsEnvelopeList />);

		expect(screen.getByText('Loading claims envelopes')).toBeInTheDocument();
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		mockClaims({
			data: undefined,
			isError: true,
			error: new ApiError('Unable to load claims envelopes.', 502),
			refetch,
		});
		const user = userEvent.setup();
		render(<ClaimsEnvelopeList />);

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load claims envelopes.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(refetch).toHaveBeenCalledOnce();
	});
});
