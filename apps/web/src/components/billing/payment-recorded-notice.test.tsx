import {act, fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PaymentRecordedNotice} from '@/components/billing/payment-recorded-notice';
import type {Payment} from '@/types/billing/payment';

const payment: Payment = {
	id: 'demo-payment-demo-invoice-001',
	invoiceId: 'demo-invoice-001',
	practiceId: 'demo-practice-001',
	amountCents: 15000,
	method: 'stripe',
	processorRef: 'demo_mock_demo-invoice-001',
	status: 'recorded',
	synthetic: true,
};

describe('PaymentRecordedNotice', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('announces the recorded payment as a status region', () => {
		render(<PaymentRecordedNotice payment={payment} onDismiss={vi.fn()} />);

		const notice = screen.getByRole('status');
		expect(notice).toHaveTextContent('Payment recorded');
		expect(notice).toHaveTextContent('Stripe (demo). Processor ref demo_mock_demo-invoice-001. $150.00 synthetic only.');
	});

	it('dismisses from the 44 px dismiss button', async () => {
		const onDismiss = vi.fn();
		const user = userEvent.setup();
		render(<PaymentRecordedNotice payment={payment} onDismiss={onDismiss} />);

		const dismiss = screen.getByRole('button', {name: 'Dismiss payment notification'});
		expect(dismiss).toHaveClass('h-11', 'w-11');
		await user.click(dismiss);
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	it('auto-dismisses after 6 s', () => {
		vi.useFakeTimers();
		const onDismiss = vi.fn();
		render(<PaymentRecordedNotice payment={payment} onDismiss={onDismiss} />);

		act(() => vi.advanceTimersByTime(5999));
		expect(onDismiss).not.toHaveBeenCalled();
		act(() => vi.advanceTimersByTime(1));
		expect(onDismiss).toHaveBeenCalledOnce();
	});

	it('pauses the timer on hover and on focus, then resumes', () => {
		vi.useFakeTimers();
		const onDismiss = vi.fn();
		render(<PaymentRecordedNotice payment={payment} onDismiss={onDismiss} />);
		const notice = screen.getByRole('status');

		fireEvent.mouseEnter(notice);
		act(() => vi.advanceTimersByTime(20000));
		expect(onDismiss).not.toHaveBeenCalled();

		fireEvent.mouseLeave(notice);
		fireEvent.focus(notice);
		act(() => vi.advanceTimersByTime(20000));
		expect(onDismiss).not.toHaveBeenCalled();

		fireEvent.blur(notice);
		act(() => vi.advanceTimersByTime(6000));
		expect(onDismiss).toHaveBeenCalledOnce();
	});
});
