import {render, screen, within} from '@testing-library/react';
import {MarketingAbout} from '@/components/marketing/marketing-about';
import {
	MARKETING_ABOUT_ARCHITECTURE,
	MARKETING_ABOUT_CTA,
	MARKETING_ABOUT_HERO,
	MARKETING_ABOUT_PURPOSE,
	MARKETING_ABOUT_STACK,
	MARKETING_ABOUT_STATE,
} from '@/components/marketing/marketing-about-copy';

describe('MarketingAbout', () => {
	it('renders sections with a single h1 and labelled landmarks', () => {
		render(<MarketingAbout />);

		expect(
			screen.getByRole('heading', {level: 1, name: MARKETING_ABOUT_HERO.heading}),
		).toBeInTheDocument();
		expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);

		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_ABOUT_PURPOSE.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_ABOUT_ARCHITECTURE.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_ABOUT_STATE.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_ABOUT_STACK.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_ABOUT_CTA.heading}),
		).toBeInTheDocument();

		expect(screen.getByRole('region', {name: MARKETING_ABOUT_HERO.heading})).toBeInTheDocument();
		expect(screen.getByRole('region', {name: MARKETING_ABOUT_PURPOSE.heading})).toBeInTheDocument();
		const aboutHero = screen.getByRole('region', {name: MARKETING_ABOUT_HERO.heading});
		const aboutPrimary = within(aboutHero).getByRole('link', {
			name: MARKETING_ABOUT_HERO.primaryCta.label,
		});
		expect(aboutPrimary.parentElement).toHaveClass('sm:flex-row');
		expect(aboutPrimary).toHaveClass('w-full', 'sm:w-auto');
	});

	it('lists intended roles and points CTAs at /demo and /platform', () => {
		render(<MarketingAbout />);

		for (const role of MARKETING_ABOUT_PURPOSE.roles) {
			expect(screen.getByText(role)).toBeInTheDocument();
		}

		const demoLinks = screen.getAllByRole('link', {name: MARKETING_ABOUT_HERO.primaryCta.label});
		expect(demoLinks.length).toBeGreaterThanOrEqual(2);
		for (const link of demoLinks) {
			expect(link).toHaveAttribute('href', '/demo');
		}

		const platformLinks = screen.getAllByRole('link', {
			name: MARKETING_ABOUT_HERO.secondaryCta.label,
		});
		expect(platformLinks.length).toBeGreaterThanOrEqual(2);
		for (const link of platformLinks) {
			expect(link).toHaveAttribute('href', '/platform');
		}
	});

	it('keeps portfolio and stack claims honest', () => {
		render(<MarketingAbout />);

		expect(screen.getByText(/is not HIPAA certified/)).toBeInTheDocument();
		expect(screen.getByText(MARKETING_ABOUT_ARCHITECTURE.note)).toBeInTheDocument();
		expect(screen.getByText(MARKETING_ABOUT_STACK.planned.title)).toBeInTheDocument();
		expect(screen.getByText(/Do not present them as current/)).toBeInTheDocument();
		expect(screen.getByText(/Do not claim a hosted production/)).toBeInTheDocument();
		expect(screen.queryByText(/HIPAA compliant/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/live video visits/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/accept payments/i)).not.toBeInTheDocument();
	});
});
