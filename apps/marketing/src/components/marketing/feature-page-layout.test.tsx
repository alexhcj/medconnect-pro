import {render, screen, within} from '@testing-library/react';
import {
	FeaturePageLayout,
	type FeaturePageLayoutProps,
} from '@/components/marketing/feature-page-layout';

const FEATURE_PAGE_TEMPLATE: FeaturePageLayoutProps = {
	hero: {
		headingId: 'feature-hero-heading',
		eyebrow: 'Feature page template · synthetic demo',
		heading: 'Module name',
		body: 'What this module does and who it is for. Copy must follow the capability matrix. Telehealth is a session shell. Billing invoices are real demo data; payments stay labeled.',
		primaryCta: {label: 'Go to demo', href: '/demo'},
		secondaryCta: {label: 'View platform', href: '/platform'},
	},
	capabilities: {
		heading: 'Key capabilities',
		headingId: 'feature-capabilities',
		items: [
			{
				title: 'What it does',
				description:
					'Describe the module from the capability matrix. Do not invent unshipped features.',
			},
			{
				title: 'Who benefits',
				description: 'Practice roles that use this workflow in the demo.',
			},
			{
				title: 'Honest status',
				description:
					'Label session-shell, mock cards, or invoice-only boundaries where they apply.',
			},
		],
	},
	walkthrough: {
		heading: 'Product walkthrough',
		headingId: 'feature-walkthrough',
		caption:
			'Synthetic demo screens. Not a production medical record and not a HIPAA-certified system.',
		image: {
			src: '/marketing/patients.png',
			alt: 'Patients directory with synthetic demo records',
		},
	},
	workflow: {
		heading: 'How this module fits the platform',
		headingId: 'feature-workflow',
		steps: [
			{
				title: 'Sign in with mock identity',
				description: 'Use the existing /login mock IdP. Not production OAuth.',
			},
			{
				title: 'Work a patient chart',
				description: 'Profiles, vitals, documents, and clinical lists as a foundation.',
			},
			{
				title: 'Schedule and join a session shell',
				description: 'Appointments plus telehealth create/join/end. No live video.',
			},
			{
				title: 'Review invoices and audit',
				description:
					'Billing invoices are real demo data; payments stay labeled boundaries.',
			},
		],
	},
	related: {
		heading: 'Related modules',
		headingId: 'feature-related',
		links: [
			{label: 'Patient management', href: '/platform/patient-management'},
			{label: 'Scheduling', href: '/platform/appointments'},
			{label: 'Telehealth', href: '/platform/telehealth'},
		],
	},
	cta: {
		headingId: 'feature-demo-cta',
		heading: 'Explore the demo',
		body: 'Enter with mock identity at /login. Synthetic data only. No hosted production and no HIPAA certification claim.',
		primaryCta: {label: 'Go to demo', href: '/demo'},
		secondaryCta: {label: 'View platform', href: '/platform'},
	},
};

describe('FeaturePageLayout', () => {
	it('renders the shared feature-page structure with landmarks', () => {
		render(<FeaturePageLayout {...FEATURE_PAGE_TEMPLATE} />);

		expect(
			screen.getByRole('heading', {level: 1, name: FEATURE_PAGE_TEMPLATE.hero.heading}),
		).toBeInTheDocument();
		expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);

		expect(
			screen.getByRole('heading', {level: 2, name: FEATURE_PAGE_TEMPLATE.capabilities.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: FEATURE_PAGE_TEMPLATE.walkthrough.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: FEATURE_PAGE_TEMPLATE.workflow.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: FEATURE_PAGE_TEMPLATE.related.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: FEATURE_PAGE_TEMPLATE.cta.heading}),
		).toBeInTheDocument();

		expect(screen.getByRole('region', {name: FEATURE_PAGE_TEMPLATE.hero.heading})).toBeInTheDocument();
		expect(
			screen.getByRole('region', {name: FEATURE_PAGE_TEMPLATE.capabilities.heading}),
		).toBeInTheDocument();
		const featureHero = screen.getByRole('region', {name: FEATURE_PAGE_TEMPLATE.hero.heading});
		const featurePrimary = within(featureHero).getByRole('link', {
			name: FEATURE_PAGE_TEMPLATE.hero.primaryCta.label,
		});
		expect(featurePrimary.parentElement).toHaveClass('sm:flex-row');
		expect(featurePrimary).toHaveClass('w-full', 'sm:w-auto');
		expect(
			screen.getByAltText(FEATURE_PAGE_TEMPLATE.walkthrough.image.alt).getAttribute('src'),
		).toContain(FEATURE_PAGE_TEMPLATE.walkthrough.image.src);
		expect(screen.getByText(FEATURE_PAGE_TEMPLATE.walkthrough.caption)).toBeInTheDocument();
		expect(screen.getByText(/Not production OAuth/)).toBeInTheDocument();
		expect(screen.getByText(/No live video/)).toBeInTheDocument();
	});

	it('wires hero, related-module, and CTA links for FE-021', () => {
		render(<FeaturePageLayout {...FEATURE_PAGE_TEMPLATE} />);

		const platformLinks = screen.getAllByRole('link', {name: 'View platform'});
		expect(platformLinks.length).toBeGreaterThanOrEqual(2);
		for (const link of platformLinks) {
			expect(link).toHaveAttribute('href', '/platform');
		}
		expect(screen.getByRole('link', {name: 'Patient management'})).toHaveAttribute(
			'href',
			'/platform/patient-management',
		);
		expect(screen.getByRole('link', {name: 'Scheduling'})).toHaveAttribute(
			'href',
			'/platform/appointments',
		);
		expect(screen.getByRole('link', {name: 'Telehealth'})).toHaveAttribute(
			'href',
			'/platform/telehealth',
		);

		const demoLinks = screen.getAllByRole('link', {name: 'Go to demo'});
		expect(demoLinks.length).toBeGreaterThanOrEqual(2);
		for (const link of demoLinks) {
			expect(link).toHaveAttribute('href', '/demo');
		}
	});
});
