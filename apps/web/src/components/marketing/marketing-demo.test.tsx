import {render, screen, within} from '@testing-library/react';
import {MarketingDemo} from '@/components/marketing/marketing-demo';
import {
	MARKETING_DEMO_CTA,
	MARKETING_DEMO_HERO,
	MARKETING_DEMO_HOW_TO_ENTER,
	MARKETING_DEMO_LOGIN_PREVIEW,
	MARKETING_DEMO_SAFETY,
	MARKETING_DEMO_WALKTHROUGH,
} from '@/components/marketing/marketing-demo-copy';

describe('MarketingDemo', () => {
	it('renders sections with a single h1 and labelled landmarks', () => {
		render(<MarketingDemo />);

		expect(
			screen.getByRole('heading', {level: 1, name: MARKETING_DEMO_HERO.heading}),
		).toBeInTheDocument();
		expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);

		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_DEMO_HOW_TO_ENTER.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_DEMO_WALKTHROUGH.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_DEMO_LOGIN_PREVIEW.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_DEMO_CTA.heading}),
		).toBeInTheDocument();

		expect(screen.getByRole('region', {name: MARKETING_DEMO_HERO.heading})).toBeInTheDocument();
		expect(screen.getByRole('note', {name: MARKETING_DEMO_SAFETY.heading})).toBeInTheDocument();
		expect(screen.getByAltText(MARKETING_DEMO_LOGIN_PREVIEW.image.alt).getAttribute('src')).toContain(
			MARKETING_DEMO_LOGIN_PREVIEW.image.src,
		);
		expect(screen.getByAltText(MARKETING_DEMO_LOGIN_PREVIEW.image.alt)).toHaveClass('max-h-[540px]');
		const demoHero = screen.getByRole('region', {name: MARKETING_DEMO_HERO.heading});
		const demoPrimary = within(demoHero).getByRole('link', {
			name: MARKETING_DEMO_HERO.primaryCta.label,
		});
		expect(demoPrimary.parentElement).toHaveClass('sm:flex-row');
		expect(demoPrimary).toHaveClass('w-full', 'sm:w-auto');
	});

	it('continues every demo sign-in control to /login', () => {
		render(<MarketingDemo />);

		const signInLinks = screen.getAllByRole('link', {name: 'Sign in to the demo'});
		expect(signInLinks.length).toBeGreaterThanOrEqual(2);
		for (const link of signInLinks) {
			expect(link).toHaveAttribute('href', '/login');
		}

		expect(
			screen.getByRole('link', {name: MARKETING_DEMO_HERO.secondaryCta.label}),
		).toHaveAttribute('href', '/platform');
		expect(
			screen.getByRole('link', {name: MARKETING_DEMO_CTA.secondaryCta.label}),
		).toHaveAttribute('href', '/security');

		for (const link of screen.getAllByRole('link')) {
			expect(link).not.toHaveAttribute('href', '/sign-in');
		}
	});

	it('wires walkthrough cards to /platform/* and keeps claims honest', () => {
		render(<MarketingDemo />);

		for (const item of MARKETING_DEMO_WALKTHROUGH.items) {
			expect(screen.getByRole('link', {name: item.status.label})).toHaveAttribute(
				'href',
				item.status.href,
			);
		}

		expect(screen.getByText(/Not live video/)).toBeInTheDocument();
		expect(screen.getByText(/not hosted payments/)).toBeInTheDocument();
		expect(screen.getByText(/Synthetic demo aggregates, not a warehouse/)).toBeInTheDocument();
		expect(screen.getByText(/Role assignment HTTP is not shipped/)).toBeInTheDocument();
		expect(screen.getByText(/This is not a second sign-in form/)).toBeInTheDocument();
		expect(screen.queryByText(/HIPAA compliant/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/live video visits/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/accept payments/i)).not.toBeInTheDocument();
	});
});
