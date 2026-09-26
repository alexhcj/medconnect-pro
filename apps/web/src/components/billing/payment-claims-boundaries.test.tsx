import {render, screen} from '@testing-library/react';
import {PaymentClaimsBoundaries} from '@/components/billing/payment-claims-boundaries';

describe('PaymentClaimsBoundaries', () => {
	it('labels payment and claims as disconnected boundaries', () => {
		render(<PaymentClaimsBoundaries />);

		expect(screen.getByRole('heading', {name: 'Payment boundary'})).toBeInTheDocument();
		expect(
			screen.getByText(/Stripe\/ACH is not connected. This demo does not process payments or collect card numbers./),
		).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'Record payment'})).toBeDisabled();
		expect(screen.getByRole('heading', {name: 'Claims boundary'})).toBeInTheDocument();
		expect(screen.getByText(/Claims \/ EDI 837 is not connected/)).toBeInTheDocument();
		expect(screen.queryByLabelText(/card/i)).not.toBeInTheDocument();
	});
});
