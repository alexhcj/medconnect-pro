import {render, screen} from '@testing-library/react';
import {MarketingCtaBand} from '@/components/marketing/marketing-cta-band';

function renderBand(rowFrom?: 'sm' | 'md' | 'lg') {
	render(
		<MarketingCtaBand
			headingId="cta"
			heading="Explore"
			body="Body copy."
			primaryCta={{label: 'Primary', href: '/a'}}
			secondaryCta={{label: 'Secondary', href: '/b'}}
			rowFrom={rowFrom}
		/>,
	);
	return screen.getByRole('link', {name: 'Primary'}).parentElement;
}

describe('MarketingCtaBand', () => {
	it('switches the buttons to a row from md by default', () => {
		expect(renderBand()).toHaveClass('flex-col', 'md:flex-row');
	});

	it.each([
		['sm', 'sm:flex-row'],
		['lg', 'lg:flex-row'],
	] as const)('switches the buttons to a row from %s', (rowFrom, cls) => {
		const row = renderBand(rowFrom);

		expect(row).toHaveClass('flex-col', cls);
		expect(row).not.toHaveClass('md:flex-row');
	});
});
