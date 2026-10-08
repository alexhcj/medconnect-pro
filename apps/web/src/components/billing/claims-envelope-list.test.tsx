import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ClaimsEnvelopeList} from '@/components/billing/claims-envelope-list';
import {ApiError} from '@/lib/api/http';
import type {Claim} from '@/types/billing/claim';

const {useClaims} = vi.hoisted(() => ({
	useClaims: vi.fn(),
}));

vi.mock('@/lib/hooks/use-billing', () => ({
	useClaims,
}));

const envelope: Claim = {
	id: 'demo-invoice-001',
	invoiceId: 'demo-invoice-001',
	status: 'not_submitted',
	processor: 'edi837',
	synthetic: true,
};

describe('ClaimsEnvelopeList', () => {
	it('renders labeled envelopes from visible invoices', () => {
		useClaims.mockReturnValue({
			data: [envelope],
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
		render(<ClaimsEnvelopeList />);

		expect(
			screen.getByText(/Labeled EDI 837 envelopes derived from visible invoices/),
		).toBeInTheDocument();
		expect(screen.getByText(/Not claim submission, X12, or denial workflow/)).toBeInTheDocument();
		expect(screen.getByRole('list', {name: 'Claim envelopes'})).toHaveTextContent('demo-invoice-001');
		expect(screen.getByText('Not submitted')).toBeInTheDocument();
		expect(screen.getByText('EDI 837 (labeled)')).toBeInTheDocument();
		expect(screen.getByText('Synthetic')).toBeInTheDocument();
		expect(screen.queryByText(/accept payments/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/X12 payload/i)).not.toBeInTheDocument();
	});

	it('shows an empty state', () => {
		useClaims.mockReturnValue({
			data: [],
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
		render(<ClaimsEnvelopeList />);

		expect(screen.getByText('No claim envelopes for visible invoices.')).toBeInTheDocument();
		expect(screen.queryByRole('list', {name: 'Claim envelopes'})).not.toBeInTheDocument();
	});

	it('shows a loading state', () => {
		useClaims.mockReturnValue({
			data: undefined,
			isPending: true,
			isError: false,
			refetch: vi.fn(),
		});
		render(<ClaimsEnvelopeList />);

		expect(screen.getByText('Loading claim envelopes')).toBeInTheDocument();
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		useClaims.mockReturnValue({
			data: undefined,
			isPending: false,
			isError: true,
			error: new ApiError('Unable to load claim envelopes.', 502),
			refetch,
		});
		const user = userEvent.setup();
		render(<ClaimsEnvelopeList />);

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load claim envelopes.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(refetch).toHaveBeenCalledOnce();
	});
});
