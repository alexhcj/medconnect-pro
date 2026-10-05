import {render, screen} from '@testing-library/react';
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

	it('keeps capability-qualified module copy', () => {
		render(<MarketingHome />);

		expect(screen.getAllByText(/Not live video/).length).toBeGreaterThan(0);
		expect(screen.getAllByText(/labeled boundaries/).length).toBeGreaterThan(0);
		expect(screen.getByText(/Synthetic demo aggregates, not a warehouse/)).toBeInTheDocument();
		expect(screen.getByText(/Role assignment UI is not shipped/)).toBeInTheDocument();
		expect(screen.getAllByText(/Not production OAuth/).length).toBeGreaterThan(0);
		expect(screen.getByText(/no HIPAA certification claim/)).toBeInTheDocument();
		expect(screen.getByText(MARKETING_PRODUCT_VISUAL_CAPTION)).toBeInTheDocument();
		expect(screen.getByRole('region', {name: 'Product screens'})).toHaveAttribute(
			'aria-roledescription',
			'carousel',
		);
		for (const slide of MARKETING_PRODUCT_SLIDES) {
			expect(screen.getByAltText(slide.alt).getAttribute('src')).toContain(slide.src);
		}
		const firstSlideImage = screen.getByAltText(MARKETING_PRODUCT_SLIDES[0].alt);
		expect(firstSlideImage.closest('[data-product-slide]')).toHaveClass(
			'w-[85%]',
			'md:w-[calc((100%-1rem)/2.15)]',
		);
		expect(firstSlideImage).toHaveClass('h-auto');
		expect(firstSlideImage.parentElement).toHaveAttribute('data-product-slide');
		expect(
			screen.getByRole('region', {name: 'Product screens'}).querySelector('[data-product-track]'),
		).toHaveClass('items-start');
		expect(screen.queryByText(/Placeholder until FE-023/)).not.toBeInTheDocument();
		const productHeading = screen.getByRole('heading', {
			level: 2,
			name: MARKETING_HOME_PREVIEW.heading,
		});
		expect(productHeading).toHaveClass('pr-24');
		expect(productHeading.parentElement).toHaveClass('relative');
		expect(screen.getByRole('button', {name: 'Previous product screen'}).parentElement).toHaveClass(
			'absolute',
			'right-0',
		);
	});

	it('moves the product slider with previous and next controls', async () => {
		const user = userEvent.setup();
		render(<MarketingHome />);

		const track = screen.getByRole('region', {name: 'Product screens'}).querySelector(
			'[data-product-track]',
		);
		expect(track).not.toBeNull();
		if (!(track instanceof HTMLElement)) {
			throw new Error('Expected slider track');
		}
		const scrollBy = vi.fn();
		Object.defineProperty(track, 'scrollBy', {value: scrollBy, configurable: true});

		await user.click(screen.getByRole('button', {name: 'Next product screen'}));
		await user.click(screen.getByRole('button', {name: 'Previous product screen'}));
		const carousel = screen.getByRole('region', {name: 'Product screens'});
		carousel.focus();
		await user.keyboard('{ArrowRight}');
		expect(scrollBy).toHaveBeenCalledTimes(3);
	});
});
