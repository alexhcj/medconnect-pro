import {render, screen} from '@testing-library/react';
import {MarketingPlatform} from '@/components/marketing/marketing-platform';
import {
	MARKETING_PLATFORM_CTA,
	MARKETING_PLATFORM_HERO,
	MARKETING_PLATFORM_MODULES,
	PLATFORM_MODULE_HREFS,
} from '@/components/marketing/marketing-platform-copy';

describe('platform module catalog', () => {
	it('maps each module to its sitemap /platform/* path', () => {
		expect(PLATFORM_MODULE_HREFS).toEqual([
			'/platform/patient-management',
			'/platform/appointments',
			'/platform/telehealth',
			'/platform/billing',
			'/platform/analytics',
			'/platform/administration',
		]);
	});
});

describe('MarketingPlatform', () => {
	it('renders overview sections with a single h1 and labelled landmarks', () => {
		render(<MarketingPlatform />);

		expect(
			screen.getByRole('heading', {level: 1, name: MARKETING_PLATFORM_HERO.heading}),
		).toBeInTheDocument();
		expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_PLATFORM_MODULES.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_PLATFORM_CTA.heading}),
		).toBeInTheDocument();

		expect(
			screen.getByRole('region', {name: MARKETING_PLATFORM_HERO.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('region', {name: MARKETING_PLATFORM_MODULES.heading}),
		).toBeInTheDocument();
		expect(screen.getByRole('region', {name: MARKETING_PLATFORM_CTA.heading})).toBeInTheDocument();
	});

	it('links each module card footer to its /platform/* path', () => {
		render(<MarketingPlatform />);

		for (const platformModule of MARKETING_PLATFORM_MODULES.items) {
			expect(screen.getByRole('link', {name: platformModule.href})).toHaveAttribute(
				'href',
				platformModule.href,
			);
		}
	});

	it('points hero and CTA actions at demo, login, and home', () => {
		render(<MarketingPlatform />);

		const demoLinks = screen.getAllByRole('link', {name: MARKETING_PLATFORM_HERO.primaryCta.label});
		expect(demoLinks.length).toBeGreaterThanOrEqual(2);
		for (const link of demoLinks) {
			expect(link).toHaveAttribute('href', '/demo');
		}

		expect(
			screen.getByRole('link', {name: MARKETING_PLATFORM_HERO.secondaryCta.label}),
		).toHaveAttribute('href', '/login');
		expect(
			screen.getByRole('link', {name: MARKETING_PLATFORM_CTA.secondaryCta.label}),
		).toHaveAttribute('href', '/');
	});

	it('keeps capability-qualified copy and does not over-claim', () => {
		render(<MarketingPlatform />);

		expect(screen.getByText('Not live video.')).toBeInTheDocument();
		expect(screen.getByText('Not hosted payments.')).toBeInTheDocument();
		expect(screen.getByText('No live Nest overview API.')).toBeInTheDocument();
		expect(screen.getByText('Role PATCH is not shipped.')).toBeInTheDocument();
		expect(screen.getByText(/no HIPAA certification claim/)).toBeInTheDocument();
		expect(screen.getAllByText(/Synthetic data only/).length).toBeGreaterThan(0);

		expect(screen.queryByText(/HIPAA compliant/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/live video visits/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/production OAuth/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/accept payments/i)).not.toBeInTheDocument();
	});
});
