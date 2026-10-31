import {render, screen} from '@testing-library/react';
import {MarketingBand, type MarketingBandTone} from '@/components/marketing/marketing-band';

describe('MarketingBand', () => {
	it.each<[MarketingBandTone, string]>([
		['surface', 'bg-surface'],
		['canvas', 'bg-canvas'],
		['brand', 'bg-brand-subtle'],
	])('paints the full-bleed wrapper for the %s tone', (tone, bg) => {
		render(
			<MarketingBand tone={tone}>
				<p>Content</p>
			</MarketingBand>,
		);

		const container = screen.getByText('Content').parentElement;
		expect(container?.parentElement).toHaveClass(bg);
		expect(container?.parentElement).not.toHaveClass('max-w-6xl');
	});

	it('defaults to surface and keeps content in a max-w-6xl container', () => {
		render(
			<MarketingBand>
				<p>Content</p>
			</MarketingBand>,
		);

		const container = screen.getByText('Content').parentElement;
		expect(container).toHaveClass('mx-auto', 'max-w-6xl', 'px-4', 'sm:px-6', 'lg:px-8');
		expect(container?.parentElement).toHaveClass('bg-surface');
	});
});
