import {fireEvent, render, screen} from '@testing-library/react';
import {MarketingProductImage} from '@/components/marketing/marketing-product-image';

describe('MarketingProductImage', () => {
	it('shows a labeled fallback when the screenshot fails to load', () => {
		render(
			<MarketingProductImage
				src="/marketing/patients.png"
				alt="Patients directory with synthetic demo records"
			/>,
		);

		fireEvent.error(screen.getByAltText('Patients directory with synthetic demo records'));

		expect(
			screen.getByRole('img', {
				name: 'Patients directory with synthetic demo records unavailable',
			}),
		).toBeInTheDocument();
		expect(screen.getByText('Screenshot unavailable')).toBeInTheDocument();
		expect(screen.queryByText(/until FE-023/)).not.toBeInTheDocument();
	});
});
