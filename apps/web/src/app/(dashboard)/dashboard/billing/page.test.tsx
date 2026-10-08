import {render, screen} from '@testing-library/react';
import BillingPage from '@/app/(dashboard)/dashboard/billing/page';
import {Invoice} from '@/types/billing/invoice';

const {useInvoices, useSessionStatus, useRecordPayment} = vi.hoisted(() => ({
	useInvoices: vi.fn(),
	useSessionStatus: vi.fn(),
	useRecordPayment: vi.fn(),
}));

vi.mock('@/lib/hooks/use-billing', () => ({
	useInvoices,
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

describe('BillingPage', () => {
	beforeEach(() => {
		useInvoices.mockClear();
		useSessionStatus.mockReturnValue({
			session: {userRole: 'PRACTICE_ADMIN'},
			isLoading: false,
		});
		useInvoices.mockReturnValue({
			data: [sampleInvoice],
			isPending: false,
			isError: false,
			refetch: vi.fn(),
		});
		useRecordPayment.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isError: false,
		});
	});

	it('renders the dashboard heading, invoices, and labeled boundaries', () => {
		render(<BillingPage />);

		expect(screen.getByRole('heading', {level: 1, name: 'Billing'})).toBeInTheDocument();
		expect(screen.getByText('Synthetic demo. Demo payments do not collect card numbers.')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Record payment'})).toBeDisabled();
		expect(screen.getByRole('list', {name: 'Invoices'})).toHaveTextContent('Avery Carter');
		expect(screen.getByRole('heading', {name: 'Payment boundary'})).toBeInTheDocument();
		expect(screen.getByRole('heading', {name: 'Claims boundary'})).toBeInTheDocument();
	});

	it('denies a nurse session without fetching invoices', () => {
		useSessionStatus.mockReturnValue({
			session: {userRole: 'NURSE'},
			isLoading: false,
		});
		render(<BillingPage />);

		expect(screen.getByRole('status')).toHaveTextContent('You do not have access to the billing dashboard.');
		expect(screen.queryByRole('list', {name: 'Invoices'})).not.toBeInTheDocument();
		expect(useInvoices).not.toHaveBeenCalled();
	});

	it('shows a session loading state', () => {
		useSessionStatus.mockReturnValue({
			session: undefined,
			isLoading: true,
		});
		render(<BillingPage />);

		expect(screen.getByText('Loading billing')).toBeInTheDocument();
		expect(useInvoices).not.toHaveBeenCalled();
	});
});
