import {render, screen} from '@testing-library/react';
import {MarketingFeaturePage} from '@/components/marketing/marketing-feature-page';
import {
	FEATURE_PAGES,
	FEATURE_PAGE_SLUGS,
	type FeaturePageSlug,
} from '@/components/marketing/marketing-feature-pages-copy';

const RELATED_HREF_BY_LABEL: Record<string, string> = {
	'Patient management': '/platform/patient-management',
	Appointments: '/platform/appointments',
	Telehealth: '/platform/telehealth',
	Billing: '/platform/billing',
	Analytics: '/platform/analytics',
	Platform: '/platform',
};

describe('feature page catalog', () => {
	it('covers the six sitemap /platform/* slugs', () => {
		expect(FEATURE_PAGE_SLUGS).toEqual([
			'patient-management',
			'appointments',
			'telehealth',
			'billing',
			'analytics',
			'administration',
		]);
		expect(Object.keys(FEATURE_PAGES)).toEqual([...FEATURE_PAGE_SLUGS]);
	});

	it('does not over-claim unimplemented product capabilities', () => {
		const catalogText = JSON.stringify(FEATURE_PAGES);

		expect(catalogText).not.toMatch(/HIPAA compliant/i);
		expect(catalogText).not.toMatch(/live video visits/i);
		expect(catalogText).not.toMatch(/accept payments/i);
		expect(catalogText).toMatch(/Not production OAuth/);
		expect(catalogText).toMatch(/no HIPAA certification claim/);
	});
});

describe.each(FEATURE_PAGE_SLUGS)('MarketingFeaturePage (%s)', (slug: FeaturePageSlug) => {
	const page = FEATURE_PAGES[slug];

	it('renders the shared structure with landmarks and a labeled walkthrough', () => {
		render(<MarketingFeaturePage slug={slug} />);

		expect(screen.getByRole('heading', {level: 1, name: page.hero.heading})).toBeInTheDocument();
		expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);
		expect(
			screen.getByRole('heading', {level: 2, name: page.capabilities.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: page.walkthrough.heading}),
		).toBeInTheDocument();
		expect(screen.getByRole('heading', {level: 2, name: page.workflow.heading})).toBeInTheDocument();
		expect(screen.getByRole('heading', {level: 2, name: page.related.heading})).toBeInTheDocument();
		expect(screen.getByRole('heading', {level: 2, name: page.cta.heading})).toBeInTheDocument();

		expect(screen.getByRole('region', {name: page.hero.heading})).toBeInTheDocument();
		expect(screen.getByRole('region', {name: page.capabilities.heading})).toBeInTheDocument();
		expect(screen.getByAltText(page.walkthrough.image.alt).getAttribute('src')).toContain(
			page.walkthrough.image.src,
		);
		expect(screen.getByText(page.walkthrough.caption)).toBeInTheDocument();
	});

	it('wires related-module and CTA links', () => {
		render(<MarketingFeaturePage slug={slug} />);

		for (const link of page.related.links) {
			expect(RELATED_HREF_BY_LABEL[link.label]).toBe(link.href);
			expect(
				screen.getByRole('link', {name: (accessibleName) => accessibleName === link.label}),
			).toHaveAttribute('href', link.href);
			expect(link.href === '/platform' || link.href.startsWith('/platform/')).toBe(true);
			expect(link.href).not.toBe('/platform/scheduling');
		}

		const demoLinks = screen.getAllByRole('link', {name: 'Go to demo'});
		expect(demoLinks.length).toBeGreaterThanOrEqual(2);
		for (const demoLink of demoLinks) {
			expect(demoLink).toHaveAttribute('href', '/demo');
		}

		const platformLinks = screen.getAllByRole('link', {name: 'View platform'});
		expect(platformLinks.length).toBeGreaterThanOrEqual(2);
		for (const platformLink of platformLinks) {
			expect(platformLink).toHaveAttribute('href', '/platform');
		}
	});
});

describe('capability-matrix copy', () => {
	it('keeps patient, scheduling, telehealth, billing, analytics, and admin claims honest', () => {
		const {rerender} = render(<MarketingFeaturePage slug="patient-management" />);
		expect(
			screen.getByText(/Directory, profiles, vitals, documents, and history/),
		).toBeInTheDocument();
		expect(screen.getAllByText(/Synthetic data only/).length).toBeGreaterThan(0);

		rerender(<MarketingFeaturePage slug="appointments" />);
		expect(screen.getByText('Browse the practice calendar in the demo.')).toBeInTheDocument();
		expect(screen.getByText(/No live video/)).toBeInTheDocument();

		rerender(<MarketingFeaturePage slug="telehealth" />);
		expect(screen.getByText('Not live video. Not Daily or WebRTC.')).toBeInTheDocument();
		expect(screen.getAllByText(/session shell/i).length).toBeGreaterThan(0);

		rerender(<MarketingFeaturePage slug="billing" />);
		expect(screen.getByText('Payments stay a labeled boundary. Not hosted payments.')).toBeInTheDocument();
		expect(screen.getByText('Claims stay a labeled boundary. Not shipped.')).toBeInTheDocument();

		rerender(<MarketingFeaturePage slug="analytics" />);
		expect(screen.getByText('Synthetic demo aggregates. Not a warehouse or HIPAA analytics.')).toBeInTheDocument();
		expect(screen.getByText('Extra chart widgets remain unscheduled.')).toBeInTheDocument();

		rerender(<MarketingFeaturePage slug="administration" />);
		expect(screen.getByText('Role PATCH is not shipped.')).toBeInTheDocument();
		expect(screen.getByText(/no HIPAA certification claim/)).toBeInTheDocument();

		expect(screen.queryByText(/HIPAA compliant/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/live video visits/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/accept payments/i)).not.toBeInTheDocument();
	});
});
