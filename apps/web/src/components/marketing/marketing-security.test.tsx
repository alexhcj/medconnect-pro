import {render, screen} from '@testing-library/react';
import {MarketingSecurity} from '@/components/marketing/marketing-security';
import {
	MARKETING_SECURITY_AUTHORIZATION,
	MARKETING_SECURITY_CALLOUT,
	MARKETING_SECURITY_CONTROLS,
	MARKETING_SECURITY_CTA,
	MARKETING_SECURITY_HERO,
	MARKETING_SECURITY_NOT_IN_DEMO,
} from '@/components/marketing/marketing-security-copy';

describe('MarketingSecurity', () => {
	it('renders sections with a single h1 and labelled landmarks', () => {
		render(<MarketingSecurity />);

		expect(
			screen.getByRole('heading', {level: 1, name: MARKETING_SECURITY_HERO.heading}),
		).toBeInTheDocument();
		expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);

		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_SECURITY_CONTROLS.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_SECURITY_AUTHORIZATION.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_SECURITY_NOT_IN_DEMO.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_SECURITY_CTA.heading}),
		).toBeInTheDocument();

		expect(screen.getByRole('region', {name: MARKETING_SECURITY_HERO.heading})).toBeInTheDocument();
		expect(
			screen.getByRole('region', {name: MARKETING_SECURITY_CONTROLS.heading}),
		).toBeInTheDocument();
		expect(
			screen.getByRole('note', {name: MARKETING_SECURITY_CALLOUT.heading}),
		).toBeInTheDocument();
	});

	it('points hero and CTA links at demo, about, login, and administration', () => {
		render(<MarketingSecurity />);

		expect(
			screen.getByRole('link', {name: MARKETING_SECURITY_HERO.primaryCta.label}),
		).toHaveAttribute('href', '/demo');
		expect(
			screen.getByRole('link', {name: MARKETING_SECURITY_HERO.secondaryCta.label}),
		).toHaveAttribute('href', '/about');
		expect(
			screen.getByRole('link', {name: MARKETING_SECURITY_CTA.primaryCta.label}),
		).toHaveAttribute('href', '/login');
		expect(
			screen.getByRole('link', {name: MARKETING_SECURITY_CTA.secondaryCta.label}),
		).toHaveAttribute('href', '/platform/administration');
	});

	it('keeps capability-qualified security copy', () => {
		render(<MarketingSecurity />);

		expect(screen.getByText(/It is not HIPAA certified/)).toBeInTheDocument();
		expect(screen.getByText(/Not production OAuth or OIDC/)).toBeInTheDocument();
		expect(screen.getByText(MARKETING_SECURITY_AUTHORIZATION.note)).toBeInTheDocument();
		expect(screen.getByText(/Do not describe mock identity as production OAuth/)).toBeInTheDocument();
		expect(screen.getByText(/no HIPAA certification claim/)).toBeInTheDocument();
		expect(screen.queryByText(/HIPAA compliant/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/live video visits/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/accept payments/i)).not.toBeInTheDocument();
	});
});
