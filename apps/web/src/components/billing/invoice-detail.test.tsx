import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {InvoiceDetail} from '@/components/billing/invoice-detail';
import {ApiError} from '@/lib/api/http';
import {Invoice} from '@/types/billing/invoice';

const {useInvoice, useSessionStatus, useRecordPayment} = vi.hoisted(() => ({
	useInvoice: vi.fn(),
	useSessionStatus: vi.fn(),
	useRecordPayment: vi.fn(),
}));

vi.mock('@/lib/hooks/use-billing', () => ({
	useInvoice,
	useRecordPayment,
}));

vi.mock('@/lib/hooks/use-session', () => ({
	useSessionStatus,
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

function mockInvoice(overrides: Record<string, unknown> = {}) {
	useInvoice.mockReturnValue({
		data: sampleInvoice,
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('InvoiceDetail', () => {
	beforeEach(() => {
		useInvoice.mockClear();
		useRecordPayment.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isError: false,
		});
		useSessionStatus.mockReturnValue({
			session: {userRole: 'PRACTICE_ADMIN'},
			isLoading: false,
		});
	});

	it('renders invoice fields, line items, and payment/claims boundaries', () => {
		mockInvoice();
		render(<InvoiceDetail invoiceId="demo-invoice-001" />);

		expect(screen.getByRole('heading', {level: 1, name: 'Invoice'})).toBeInTheDocument();
		expect(screen.getByText('Synthetic demo. Demo payments do not collect card numbers.')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Record payment'})).toBeEnabled();
		expect(screen.getByText('demo-invoice-001')).toBeInTheDocument();
		expect(screen.getByText('Avery Carter')).toBeInTheDocument();
		expect(screen.getByText('Issued')).toBeInTheDocument();
		expect(screen.getAllByText('$150.00').length).toBeGreaterThan(0);
		expect(screen.getByRole('list', {name: 'Line items'})).toHaveTextContent('Office visit');
		expect(screen.getByRole('heading', {name: 'Payment boundary'})).toBeInTheDocument();
		expect(screen.getByRole('heading', {name: 'Claims boundary'})).toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Back to billing'})).toHaveAttribute('href', '/dashboard/billing');
		expect(useInvoice).toHaveBeenCalledWith('demo-invoice-001', true);
	});

	it('disables record payment for a provider session', () => {
		useSessionStatus.mockReturnValue({
			session: {userRole: 'PROVIDER'},
			isLoading: false,
		});
		mockInvoice();
		render(<InvoiceDetail invoiceId="demo-invoice-001" />);

		expect(screen.getByRole('button', {name: 'Record payment'})).toBeDisabled();
		expect(
			screen.getByText(/Providers can review invoices. Recording a payment requires a practice admin or receptionist./),
		).toBeInTheDocument();
	});

	it('denies a nurse session', () => {
		useSessionStatus.mockReturnValue({
			session: {userRole: 'NURSE'},
			isLoading: false,
		});
		mockInvoice();
		render(<InvoiceDetail invoiceId="demo-invoice-001" />);

		expect(screen.getByRole('status')).toHaveTextContent('You do not have access to the billing dashboard.');
		expect(screen.queryByRole('heading', {level: 1, name: 'Invoice'})).not.toBeInTheDocument();
		expect(useInvoice).toHaveBeenCalledWith('demo-invoice-001', false);
	});

	it('shows an error alert and retries', async () => {
		const refetch = vi.fn();
		mockInvoice({data: undefined, isError: true, error: new ApiError('Unable to load this invoice.', 502), refetch});
		const user = userEvent.setup();
		render(<InvoiceDetail invoiceId="missing" />);

		expect(screen.getByRole('alert')).toHaveTextContent('Unable to load this invoice.');
		await user.click(screen.getByRole('button', {name: 'Retry'}));
		expect(refetch).toHaveBeenCalledOnce();
	});

	it('shows a not-found error for an unknown invoice', () => {
		mockInvoice({
			data: undefined,
			isError: true,
			error: new ApiError('Invoice was not found.', 404, {code: 'NOT_FOUND'}),
			refetch: vi.fn(),
		});
		render(<InvoiceDetail invoiceId="demo-invoice-missing" />);

		expect(screen.getByRole('alert')).toHaveTextContent('Invoice was not found.');
	});
});
