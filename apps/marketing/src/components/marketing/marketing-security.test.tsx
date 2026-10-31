import {render, screen, within} from '@testing-library/react';
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
		expect(screen.getByRole('link', {name: MARKETING_SECURITY_HERO.primaryCta.label}).parentElement).toHaveClass(
			'sm:flex-row',
		);
		expect(screen.getByRole('link', {name: MARKETING_SECURITY_HERO.primaryCta.label})).toHaveClass(
			'w-full',
			'sm:w-auto',
		);
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
		).toHaveAttribute('href', 'http://localhost:3000/login');
		expect(
			screen.getByRole('link', {name: MARKETING_SECURITY_CTA.secondaryCta.label}),
		).toHaveAttribute('href', '/platform/administration');
	});

	it('links each implemented control to where it is enforced on /architecture', () => {
		render(<MarketingSecurity />);

		const section = screen.getByRole('region', {name: MARKETING_SECURITY_CONTROLS.heading});
		const links = within(section).getAllByRole('link', {name: /Where it's enforced/});
		expect(links).toHaveLength(MARKETING_SECURITY_CONTROLS.items.length);
		expect(links.map((link) => link.getAttribute('href'))).toEqual([
			'/architecture#sign-in',
			'/architecture#api',
			'/architecture#database',
			'/architecture#api',
			'/architecture#database',
			'/architecture#api',
		]);
		MARKETING_SECURITY_CONTROLS.items.forEach((item, index) => {
			expect(links[index]).toHaveAccessibleName(`Where it's enforced: ${item.title}`);
			expect(within(links[index].closest('li')!).getByText(item.status)).toBeInTheDocument();
		});

		const notInDemo = screen.getByRole('region', {name: MARKETING_SECURITY_NOT_IN_DEMO.heading});
		expect(within(notInDemo).queryByRole('link')).toBeNull();
	});

	it('keeps capability-qualified security copy', () => {
		render(<MarketingSecurity />);

		expect(screen.getByText(/It is not HIPAA certified/)).toBeInTheDocument();
		expect(screen.getByText(/Demo OIDC \+ PKCE \(Google or Fake\)\. Not a production IdP\./)).toBeInTheDocument();
		expect(screen.getByText(MARKETING_SECURITY_AUTHORIZATION.note)).toBeInTheDocument();
		expect(screen.getByText(/Do not describe mock identity as production OAuth/)).toBeInTheDocument();
		expect(screen.getByText(/no HIPAA certification claim/)).toBeInTheDocument();
		expect(screen.queryByText(/HIPAA compliant/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/live video visits/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/accept payments/i)).not.toBeInTheDocument();
	});
});
