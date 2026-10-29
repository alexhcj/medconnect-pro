import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
import {
	MARKETING_PRODUCT_SLIDES,
	MARKETING_PRODUCT_VISUAL_CAPTION,
} from '@/components/marketing/marketing-product-visuals';

/** FE-052 "Approved new copy" table. Update together with the task file. */
const APPROVED_ROLE_COPY = [
	['Practice admin', 'Users, role assignment, audit viewer, and billing for the practice.'],
	['Provider', 'Patients, appointments, telehealth, and practice invoices.'],
	['Nurse', 'Assigned patients, appointments, and telehealth.'],
	['Receptionist', 'Patient demographics, scheduling, and invoices.'],
	['Patient', 'Own appointments, telehealth visits, and invoices only.'],
	['Super admin', 'Every module, scoped to the signed-in practice.'],
] as const;

function bandToneOf(heading: HTMLElement): string | undefined {
	const band = heading.closest('.bg-surface, .bg-canvas, .bg-brand-subtle');
	return ['bg-surface', 'bg-canvas', 'bg-brand-subtle'].find((tone) =>
		band?.classList.contains(tone),
	);
}

describe('MarketingHome', () => {
	it('renders sections in FE-052 order on their band tones', () => {
		render(<MarketingHome />);

		const order = [
			[MARKETING_HOME_MODULES.heading, 'bg-surface'],
			[MARKETING_HOME_WORKFLOW.heading, 'bg-canvas'],
			[MARKETING_HOME_PREVIEW.heading, 'bg-surface'],
			[MARKETING_HOME_SECURITY_PRINCIPLES.heading, 'bg-canvas'],
			[MARKETING_HOME_UX_PRINCIPLES.heading, 'bg-surface'],
			[MARKETING_HOME_ROLES.heading, 'bg-surface'],
			[MARKETING_HOME_CTA.heading, 'bg-brand-subtle'],
		] as const;
		const headings = screen.getAllByRole('heading', {level: 2}).map((h) => h.textContent);
		expect(headings).toEqual(order.map(([name]) => name));
		for (const [name, tone] of order) {
			expect(bandToneOf(screen.getByRole('heading', {level: 2, name}))).toBe(tone);
		}

		const heroBand = screen
			.getByRole('heading', {level: 1, name: MARKETING_HOME_HERO.heading})
			.closest('.bg-surface');
		expect(heroBand).not.toBeNull();
		const ctaBand = screen
			.getByRole('heading', {level: 2, name: MARKETING_HOME_CTA.heading})
			.closest('section')
			?.parentElement;
		expect(ctaBand).toHaveClass('pt-0');
		expect(
			screen.getByRole('heading', {level: 2, name: MARKETING_HOME_ROLES.heading}).closest('section')
				?.parentElement,
		).toHaveClass('pt-0');
	});

	it('renders a single h1 and labelled landmarks', () => {
		render(<MarketingHome />);

		expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);
		expect(screen.getByRole('region', {name: MARKETING_HOME_HERO.heading})).toBeInTheDocument();
		expect(screen.getByRole('region', {name: MARKETING_HOME_MODULES.heading})).toBeInTheDocument();
		expect(screen.getByRole('region', {name: MARKETING_HOME_ROLES.heading})).toBeInTheDocument();
	});

	it('shows the hero dashboard image from md and the two claim chips from lg', () => {
		const {container} = render(<MarketingHome />);

		const visual = container.querySelector('[data-hero-visual]');
		expect(visual).toHaveClass('hidden', 'md:block');
		expect(within(visual as HTMLElement).getByRole('img')).toHaveAttribute(
			'alt',
			'Dashboard overview with synthetic demo metrics',
		);
		const chips = screen.getByRole('list', {name: 'Demo highlights'});
		expect(chips).toHaveClass('hidden', 'lg:block');
		expect(within(chips).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
			'RBAC and tenant isolation',
			'Synthetic data only',
		]);
	});

	it('points hero and demo CTAs at /platform and /demo', () => {
		render(<MarketingHome />);

		expect(
			screen.getByRole('link', {name: MARKETING_HOME_HERO.primaryCta.label}),
		).toHaveAttribute('href', '/platform');
		expect(
			screen.getByRole('link', {name: MARKETING_HOME_HERO.secondaryCta.label}),
		).toHaveAttribute('href', '/demo');
		expect(screen.getByRole('link', {name: MARKETING_HOME_HERO.primaryCta.label})).toHaveClass(
			'w-full',
			'sm:w-auto',
		);
		expect(screen.getByRole('link', {name: MARKETING_HOME_CTA.primaryCta.label})).toHaveAttribute(
			'href',
			'/demo',
		);
		expect(
			screen.getByRole('link', {name: MARKETING_HOME_CTA.secondaryCta.label}),
		).toHaveAttribute('href', '/platform');
	});

	it('links every practice module card to its platform page with a hidden icon', () => {
		render(<MarketingHome />);

		const modules = screen.getByRole('region', {name: MARKETING_HOME_MODULES.heading});
		for (const item of MARKETING_HOME_MODULES.items) {
			const link = within(modules).getByRole('link', {name: new RegExp(item.title)});
			expect(link).toHaveAttribute('href', item.href);
			const icons = link.querySelectorAll('svg');
			expect(icons.length).toBeGreaterThanOrEqual(2);
			for (const icon of icons) {
				expect(icon).toHaveAttribute('aria-hidden', 'true');
			}
		}
	});

	it('keeps capability-qualified module copy', () => {
		render(<MarketingHome />);

		expect(screen.getAllByText(/demo Daily media when configured/).length).toBeGreaterThan(0);
		expect(screen.getAllByText(/in-process adapter/).length).toBeGreaterThan(0);
		expect(screen.getAllByText(/labeled envelopes/).length).toBeGreaterThan(0);
		expect(screen.getByText(/Synthetic demo aggregates, not a warehouse/)).toBeInTheDocument();
		expect(screen.getByText(/tenant\/grant limits/)).toBeInTheDocument();
		expect(screen.getAllByText(/Not production OAuth/).length).toBeGreaterThan(0);
		expect(screen.getByText(/no HIPAA certification claim/)).toBeInTheDocument();
		expect(screen.getByText(MARKETING_PRODUCT_VISUAL_CAPTION)).toBeInTheDocument();
	});

	it('renders five security cards with the /security intro and link', () => {
		render(<MarketingHome />);

		const security = screen.getByRole('region', {name: MARKETING_HOME_SECURITY_PRINCIPLES.heading});
		expect(within(security).getAllByRole('heading', {level: 3}).map((h) => h.textContent)).toEqual([
			'Mock identity',
			'RBAC and tenant isolation',
			'Audit events',
			'PostgreSQL RLS',
			'Document ACL',
		]);
		expect(within(security).getByText(/privacy-by-design engineering patterns/)).toBeInTheDocument();
		expect(within(security).getByRole('link', {name: 'Security'})).toHaveAttribute(
			'href',
			'/security',
		);
	});

	it('renders UX principles as a 3 / 2 / 1 column text-only grid', () => {
		render(<MarketingHome />);

		const ux = screen.getByRole('region', {name: MARKETING_HOME_UX_PRINCIPLES.heading});
		const list = within(ux).getByRole('list');
		expect(list).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3');
		expect(within(list).getAllByRole('listitem')).toHaveLength(3);
		expect(list.querySelector('svg')).toBeNull();
	});

	it('renders role cards with the approved scope copy', () => {
		render(<MarketingHome />);

		const roles = screen.getByRole('region', {name: MARKETING_HOME_ROLES.heading});
		expect(
			within(roles).getByText(
				'Each role sees only the modules and records its permissions allow. Synthetic demo accounts only.',
			),
		).toBeInTheDocument();
		const list = within(roles).getByRole('list');
		expect(list).toHaveClass('grid-cols-2', 'md:grid-cols-3');
		const cards = within(list).getAllByRole('listitem');
		expect(cards).toHaveLength(APPROVED_ROLE_COPY.length);
		APPROVED_ROLE_COPY.forEach(([label, scope], index) => {
			expect(within(cards[index]).getByRole('heading', {level: 3})).toHaveTextContent(label);
			const scopeLine = within(cards[index]).getByText(scope);
			expect(scopeLine).toHaveClass('hidden', 'md:block');
		});
	});

	it('labels each product slide and keeps the carousel region', () => {
		render(<MarketingHome />);

		const carousel = screen.getByRole('region', {name: 'Product screens'});
		expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
		MARKETING_PRODUCT_SLIDES.forEach((slide, index) => {
			const group = within(carousel).getByRole('group', {
				name: `${index + 1} of ${MARKETING_PRODUCT_SLIDES.length}: ${slide.label}`,
			});
			expect(group).toHaveAttribute('aria-roledescription', 'slide');
			expect(within(group).getByAltText(slide.alt).getAttribute('src')).toContain(slide.src);
		});
		expect(carousel.querySelector('[data-product-track]')).toHaveClass('motion-safe:scroll-smooth');
	});

	it('moves the product slider with chips, previous/next and arrow keys, and announces it', async () => {
		const user = userEvent.setup();
		render(<MarketingHome />);

		const track = screen
			.getByRole('region', {name: 'Product screens'})
			.querySelector('[data-product-track]');
		if (!(track instanceof HTMLElement)) {
			throw new Error('Expected slider track');
		}
		const scrollTo = vi.fn();
		Object.defineProperty(track, 'scrollTo', {value: scrollTo, configurable: true});
		const live = document.querySelector('[data-slide-announcement]');
		const chips = screen.getByRole('group', {name: 'Choose a product screen'});
		const previous = screen.getByRole('button', {name: 'Previous product screen'});
		const next = screen.getByRole('button', {name: 'Next product screen'});

		expect(live).toHaveTextContent('');
		expect(previous).toBeDisabled();
		expect(within(chips).getByRole('button', {name: 'Patients'})).toHaveAttribute(
			'aria-current',
			'true',
		);

		await user.click(next);
		expect(live).toHaveTextContent('Slide 2 of 6: Appointments');
		expect(within(chips).getByRole('button', {name: 'Appointments'})).toHaveAttribute(
			'aria-current',
			'true',
		);

		await user.click(within(chips).getByRole('button', {name: 'Administration'}));
		expect(live).toHaveTextContent('Slide 6 of 6: Administration');
		expect(next).toBeDisabled();

		screen.getByRole('region', {name: 'Product screens'}).focus();
		await user.keyboard('{ArrowLeft}');
		expect(live).toHaveTextContent('Slide 5 of 6: Analytics');
		expect(scrollTo).toHaveBeenCalledTimes(3);
	});
});
