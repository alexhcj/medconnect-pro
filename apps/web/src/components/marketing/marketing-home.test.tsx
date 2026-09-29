import {render, screen} from '@testing-library/react';
import {MarketingHome} from '@/components/marketing/marketing-home';
import {
	MARKETING_HOME_CTA,
	MARKETING_HOME_HERO,
	MARKETING_HOME_MODULES,
	MARKETING_HOME_PREVIEW,
	MARKETING_HOME_ROLES,
	MARKETING_HOME_SECURITY_PRINCIPLES,
	MARKETING_HOME_UX_PRINCIPLES,
	MARKETING_HOME_WORKFLOW,
} from '@/components/marketing/marketing-home-copy';

describe('MarketingHome', () => {
	it('renders homepage sections with a single h1 and labelled landmarks', () => {
		render(<MarketingHome />);

		expect(
			screen.getByRole('heading', {level: 1, name: MARKETING_HOME_HERO.heading}),
		).toBeInTheDocument();
		expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);

		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_HOME_MODULES.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_HOME_WORKFLOW.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_HOME_PREVIEW.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_HOME_UX_PRINCIPLES.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {
				level: 2,
				name: MARKETING_HOME_SECURITY_PRINCIPLES.heading,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_HOME_ROLES.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_HOME_CTA.heading}),
		).toBeInTheDocument();

		expect(screen.getByRole('region', {name: MARKETING_HOME_HERO.heading})).toBeInTheDocument();
		expect(
			screen.getByRole('region', {name: MARKETING_HOME_MODULES.heading}),
		).toBeInTheDocument();
	});

	it('points hero and demo CTAs at /platform and /demo', () => {
		render(<MarketingHome />);

		expect(
			screen.getByRole('link', {name: MARKETING_HOME_HERO.primaryCta.label}),
		).toHaveAttribute('href', '/platform');
		expect(
			screen.getByRole('link', {name: MARKETING_HOME_HERO.secondaryCta.label}),
		).toHaveAttribute('href', '/demo');
		expect(screen.getByRole('link', {name: MARKETING_HOME_CTA.primaryCta.label})).toHaveAttribute(
			'href',
			'/demo',
		);
		expect(
			screen.getByRole('link', {name: MARKETING_HOME_CTA.secondaryCta.label}),
		).toHaveAttribute('href', '/platform');
	});

	it('keeps capability-qualified module copy', () => {
		render(<MarketingHome />);

		expect(screen.getAllByText(/Not live video/).length).toBeGreaterThan(0);
		expect(screen.getAllByText(/labeled boundaries/).length).toBeGreaterThan(0);
		expect(screen.getByText(/No live Nest overview API/)).toBeInTheDocument();
		expect(screen.getByText(/Role PATCH is not shipped/)).toBeInTheDocument();
		expect(screen.getAllByText(/Not production OAuth/).length).toBeGreaterThan(0);
		expect(screen.getByText(/no HIPAA certification claim/)).toBeInTheDocument();
		expect(screen.getByLabelText(MARKETING_HOME_PREVIEW.slotLabel)).toBeInTheDocument();
	});
});
