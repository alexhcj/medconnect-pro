import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PaymentClaimsBoundaries} from '@/components/billing/payment-claims-boundaries';
import type {Invoice} from '@/types/billing/invoice';

const {useRecordPayment} = vi.hoisted(() => ({
	useRecordPayment: vi.fn(),
}));

vi.mock('@/lib/hooks/use-billing', () => ({
	useRecordPayment,
}));

const unpaid: Invoice = {
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

describe('PaymentClaimsBoundaries', () => {
	beforeEach(() => {
		useRecordPayment.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isError: false,
		});
	});

	it('keeps record payment disabled on the list without an invoice', () => {
		render(<PaymentClaimsBoundaries canRecord />);

		expect(screen.getByRole('heading', {name: 'Payment boundary'})).toBeInTheDocument();
		expect(screen.getByText(/Open an unpaid invoice to record a demo payment/)).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Record payment'})).toBeDisabled();
		expect(screen.getByRole('heading', {name: 'Claims boundary'})).toBeInTheDocument();
		expect(screen.getByText(/Claims \/ EDI 837 is not connected/)).toBeInTheDocument();
		expect(screen.queryByLabelText(/card/i)).not.toBeInTheDocument();
	});

	it('enables record payment for an entitled role on an unpaid invoice', async () => {
		const user = userEvent.setup();
		render(<PaymentClaimsBoundaries invoice={unpaid} canRecord />);

		const trigger = screen.getByRole('button', {name: 'Record payment'});
		expect(trigger).toBeEnabled();
		await user.click(trigger);

		expect(screen.getByRole('dialog', {name: 'Record payment'})).toBeInTheDocument();
		expect(screen.getByRole('radio', {name: 'Stripe (demo)'})).toBeChecked();
		expect(screen.getByRole('radio', {name: 'ACH (demo)'})).toBeInTheDocument();
		expect(screen.queryByLabelText(/card/i)).not.toBeInTheDocument();
	});

	it('disables record payment for a provider', () => {
		render(<PaymentClaimsBoundaries invoice={unpaid} canRecord={false} />);

		expect(
			screen.getByText(/Providers can review invoices. Recording a payment requires a practice admin or receptionist./),
		).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Record payment'})).toBeDisabled();
	});

	it('disables record payment on a paid invoice', () => {
		render(<PaymentClaimsBoundaries invoice={{...unpaid, status: 'paid'}} canRecord />);

		expect(screen.getByText(/This invoice is already paid/)).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Record payment'})).toBeDisabled();
	});
});
