import {render, screen, within} from '@testing-library/react';
import {MarketingAbout} from '@/components/marketing/marketing-about';
import {
	MARKETING_ABOUT_ARCHITECTURE,
	MARKETING_ABOUT_CTA,
	MARKETING_ABOUT_HERO,
	MARKETING_ABOUT_PURPOSE,
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
		expect(screen.queryByRole('heading', {level: 2, name: /current .*vs planned/i})).toBeNull();
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
			expect(screen.getByText(role)).toHaveClass('bg-brand-subtle', 'text-brand-hover');
			expect(screen.getByText(role).parentElement).toHaveClass('gap-3');
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

	it('shows implementation state as Shipped, In progress and Up next lists plus a Paused line', () => {
		render(<MarketingAbout />);

		const section = screen.getByRole('region', {name: MARKETING_ABOUT_STATE.heading});
		const columnHeadings = within(section).getAllByRole('heading', {level: 3});
		expect(columnHeadings.map((heading) => heading.textContent)).toEqual([
			'Shipped',
			'In progress',
			'Up next',
		]);

		for (const column of MARKETING_ABOUT_STATE.columns) {
			const list = within(section).getByRole('list', {name: column.label});
			const items = within(list).getAllByRole('listitem');
			expect(items).toHaveLength(column.items.length);
			column.items.forEach((item, index) => {
				expect(items[index]).toHaveTextContent(item.title);
			});
		}

		const shipped = within(section).getByRole('list', {name: 'Shipped'});
		expect(within(shipped).getByText('1.0.0 demo release')).toBeInTheDocument();
		const inProgress = within(section).getByRole('list', {name: 'In progress'});
		expect(within(inProgress).getByText('Accessibility follow-ups')).toBeInTheDocument();
		const upNext = within(section).getByRole('list', {name: 'Up next'});
		expect(within(upNext).getByText('Telehealth 2.0')).toBeInTheDocument();

		const paused = within(section).getByText(MARKETING_ABOUT_STATE.paused.text);
		expect(paused.parentElement).toHaveTextContent(MARKETING_ABOUT_STATE.paused.label);
		expect(section).not.toHaveTextContent(/\b(FE|BE|SEC|QA|DATA|INFRA)-\d+/);
	});

	it('links the architecture section to /architecture', () => {
		render(<MarketingAbout />);

		const section = screen.getByRole('region', {name: MARKETING_ABOUT_ARCHITECTURE.heading});
		expect(
			within(section).getByRole('link', {name: new RegExp(MARKETING_ABOUT_ARCHITECTURE.link.title)}),
		).toHaveAttribute('href', '/architecture');
	});

	it('keeps portfolio claims honest', () => {
		render(<MarketingAbout />);

		expect(screen.getByText(/is not HIPAA certified/)).toBeInTheDocument();
		expect(screen.getByText(MARKETING_ABOUT_ARCHITECTURE.note)).toBeInTheDocument();
		expect(screen.getByText(MARKETING_ABOUT_STATE.paused.text)).toBeInTheDocument();
		expect(screen.queryByText(/HIPAA compliant/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/live video visits/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/accept payments/i)).not.toBeInTheDocument();
	});
});
