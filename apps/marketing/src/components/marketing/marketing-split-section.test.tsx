import {render, screen} from '@testing-library/react';
import {MarketingSplitSection} from '@/components/marketing/marketing-split-section';

function renderSplit(props: {reverse?: boolean; withLink?: boolean} = {}) {
	return render(
		<MarketingSplitSection
			headingId="split-heading"
			title="Built for the practice"
			intro="Short intro."
			link={props.withLink === false ? undefined : {label: 'Explore platform', href: '/platform'}}
			reverse={props.reverse}
		>
			<p>Item column</p>
		</MarketingSplitSection>,
	);
}

describe('MarketingSplitSection', () => {
	it('labels the section by its heading and renders heading, intro and items', () => {
		renderSplit();

		const section = screen.getByRole('region', {name: 'Built for the practice'});
		expect(section).toHaveAttribute('aria-labelledby', 'split-heading');
		expect(screen.getByRole('heading', {level: 2, name: 'Built for the practice'})).toHaveAttribute(
			'id',
			'split-heading',
		);
		expect(screen.getByText('Short intro.')).toBeInTheDocument();
		expect(screen.getByText('Item column')).toBeInTheDocument();
	});

	it('stacks below lg and splits 5/7 from lg', () => {
		renderSplit();

		const lead = screen.getByRole('heading', {level: 2}).parentElement;
		const items = screen.getByText('Item column').parentElement;
		expect(lead?.parentElement).toHaveClass('grid', 'lg:grid-cols-12');
		expect(lead).toHaveClass('lg:col-span-5');
		expect(items).toHaveClass('lg:col-span-7');
		expect(lead).not.toHaveClass('lg:order-2');
		expect(items).not.toHaveClass('lg:order-1');
	});

	it('reverses the columns visually from lg and keeps the lead first in the DOM', () => {
		renderSplit({reverse: true});

		const lead = screen.getByRole('heading', {level: 2}).parentElement;
		const items = screen.getByText('Item column').parentElement;
		expect(lead).toHaveClass('lg:order-2');
		expect(items).toHaveClass('lg:order-1');
		expect(lead?.nextElementSibling).toBe(items);
	});

	it('renders the optional link with a hidden arrow icon and a visible focus ring', () => {
		renderSplit();

		const link = screen.getByRole('link', {name: 'Explore platform'});
		expect(link).toHaveAttribute('href', '/platform');
		expect(link).toHaveClass('min-h-11', 'focus-visible:ring-2', 'focus-visible:ring-ring');
		expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
	});

	it('omits the link when none is given', () => {
		renderSplit({withLink: false});

		expect(screen.queryByRole('link')).toBeNull();
	});
});
