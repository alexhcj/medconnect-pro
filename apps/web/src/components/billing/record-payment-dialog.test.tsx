import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RecordPaymentDialog} from '@/components/billing/record-payment-dialog';
import {ApiError} from '@/lib/api/http';
import type {Invoice} from '@/types/billing/invoice';
import type {Payment} from '@/types/billing/payment';

const {useRecordPayment} = vi.hoisted(() => ({
	useRecordPayment: vi.fn(),
}));

vi.mock('@/lib/hooks/use-billing', () => ({
	useRecordPayment,
}));

const invoice: Invoice = {
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

const payment: Payment = {
	id: 'demo-payment-001',
	invoiceId: invoice.id,
	practiceId: invoice.practiceId,
	amountCents: 15000,
	method: 'ach',
	processorRef: 'demo_mock_demo-invoice-001',
	status: 'recorded',
	synthetic: true,
};

describe('RecordPaymentDialog', () => {
	it('submits stripe or ach without card fields', async () => {
		const mutate = vi.fn((_body, options?: {onSuccess?: (value: Payment) => void}) => {
			options?.onSuccess?.(payment);
		});
		useRecordPayment.mockReturnValue({
			mutate,
			isPending: false,
			isError: false,
		});
		const onRecorded = vi.fn();
		const onClose = vi.fn();
		const user = userEvent.setup();
		render(
			<RecordPaymentDialog invoice={invoice} open onClose={onClose} onRecorded={onRecorded} />,
		);

		await user.click(screen.getByRole('radio', {name: 'ACH (demo)'}));
		await user.click(screen.getByRole('button', {name: 'Confirm payment'}));

		expect(mutate).toHaveBeenCalledWith(
			{invoiceId: 'demo-invoice-001', method: 'ach'},
			expect.objectContaining({onSuccess: expect.any(Function)}),
		);
		expect(onRecorded).toHaveBeenCalledWith(payment);
		expect(onClose).toHaveBeenCalled();
		expect(screen.queryByLabelText(/card/i)).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/account number/i)).not.toBeInTheDocument();
	});

	it('exposes the methods as a labelled native radio group with 44px rows', async () => {
		useRecordPayment.mockReturnValue({mutate: vi.fn(), isPending: false, isError: false});
		const user = userEvent.setup();
		render(<RecordPaymentDialog invoice={invoice} open onClose={vi.fn()} onRecorded={vi.fn()} />);

		expect(screen.getByRole('group', {name: 'Method'})).toBeInTheDocument();
		const stripe = screen.getByRole('radio', {name: 'Stripe (demo)'});
		const ach = screen.getByRole('radio', {name: 'ACH (demo)'});
		expect(stripe).toBeChecked();
		expect(stripe.closest('label')).toHaveClass('min-h-11');
		expect(ach.closest('label')).toHaveClass('min-h-11');
		expect(ach.closest('label')?.parentElement).toHaveClass('space-y-0.5');

		stripe.focus();
		await user.keyboard('{ArrowDown}');
		expect(ach).toBeChecked();
	});

	it('disables the method radios while the payment is pending', () => {
		useRecordPayment.mockReturnValue({mutate: vi.fn(), isPending: true, isError: false});
		render(<RecordPaymentDialog invoice={invoice} open onClose={vi.fn()} onRecorded={vi.fn()} />);

		expect(screen.getByRole('radio', {name: 'Stripe (demo)'})).toBeDisabled();
		expect(screen.getByRole('radio', {name: 'ACH (demo)'})).toBeDisabled();
	});

	it('surfaces a 409 already-paid conflict', () => {
		useRecordPayment.mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isError: true,
			error: new ApiError('This invoice has already been paid.', 409, {code: 'INVOICE_ALREADY_PAID'}),
		});
		render(<RecordPaymentDialog invoice={invoice} open onClose={vi.fn()} onRecorded={vi.fn()} />);

		expect(screen.getByRole('alert')).toHaveTextContent('This invoice has already been paid.');
	});
});
