import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {InvoiceList} from '@/components/billing/invoice-list';
import {Invoice} from '@/types/billing/invoice';

const {useInvoices} = vi.hoisted(() => ({
	useInvoices: vi.fn(),
}));

vi.mock('@/lib/hooks/use-billing', () => ({
	useInvoices,
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

function mockInvoices(overrides: Record<string, unknown> = {}) {
	useInvoices.mockReturnValue({
		data: [sampleInvoice],
		isPending: false,
		isError: false,
		refetch: vi.fn(),
		...overrides,
	});
}

describe('InvoiceList', () => {
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

	it('shows a loading state', () => {
		mockInvoices({data: undefined, isPending: true});
		render(<InvoiceList />);

		expect(screen.getByText('Loading invoices')).toBeInTheDocument();
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

	it('shows an empty message', () => {
		mockInvoices({data: []});
		render(<InvoiceList />);

		expect(screen.getByText('No invoices to display.')).toBeInTheDocument();
	});
});
