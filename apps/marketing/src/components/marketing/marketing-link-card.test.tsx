import {render, screen} from '@testing-library/react';
import {CalendarDays} from 'lucide-react';
import {MarketingLinkCard} from '@/components/marketing/marketing-link-card';

describe('MarketingLinkCard', () => {
	it('is one link whose name carries title and description', () => {
		render(
			<MarketingLinkCard href="/platform/appointments" title="Scheduling" description="Calendar views." />,
		);

		const links = screen.getAllByRole('link');
		expect(links).toHaveLength(1);
		expect(links[0]).toHaveAttribute('href', '/platform/appointments');
		expect(links[0]).toHaveAccessibleName('Scheduling Calendar views.');
		expect(links[0].querySelector('a')).toBeNull();
	});

	it('meets the 44px target and shows a visible focus ring', () => {
		render(<MarketingLinkCard href="/x" title="Title" />);

		expect(screen.getByRole('link')).toHaveClass(
			'min-h-11',
			'focus-visible:ring-2',
			'focus-visible:ring-ring',
			'focus-visible:ring-offset-2',
		);
	});

	it('always shows a trailing arrow and a hover state, both hidden from assistive tech', () => {
		render(<MarketingLinkCard href="/x" title="Title" />);

		const link = screen.getByRole('link');
		expect(link).toHaveClass('hover:border-border-strong', 'hover:shadow-md');
		const svgs = link.querySelectorAll('svg');
		expect(svgs).toHaveLength(1);
		expect(svgs[0]).toHaveAttribute('aria-hidden', 'true');
		expect(svgs[0]).toHaveClass('group-hover:translate-x-0.5');
	});

	it('renders an optional leading icon as aria-hidden', () => {
		render(<MarketingLinkCard href="/x" title="Title" icon={CalendarDays} />);

		const svgs = screen.getByRole('link').querySelectorAll('svg');
		expect(svgs).toHaveLength(2);
		expect(svgs[0]).toHaveClass('text-brand', 'size-5');
		for (const svg of svgs) expect(svg).toHaveAttribute('aria-hidden', 'true');
	});
});
