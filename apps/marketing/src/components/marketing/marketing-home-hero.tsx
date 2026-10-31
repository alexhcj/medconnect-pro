import Link from 'next/link';
import {Badge} from '@/components/ui/badge';
import {buttonVariants} from '@/components/ui/button';
import {MARKETING_HOME_HERO} from '@/components/marketing/marketing-home-copy';
import {MarketingProductImage} from '@/components/marketing/marketing-product-image';
import {MARKETING_PRODUCT_SLIDE_BY_FEATURE} from '@/components/marketing/marketing-product-visuals';
import {cn} from '@/lib/utils/utils';

const HERO_IMAGE = MARKETING_PRODUCT_SLIDE_BY_FEATURE.analytics;

const CHIP_POSITION_CLASS_NAME = ['-left-5 bottom-6', '-right-5 top-6'] as const;

export function MarketingHomeHero() {
	return (
		<section
			aria-labelledby="home-hero-heading"
			className="grid items-center gap-12 lg:grid-cols-12"
		>
			<div className="lg:col-span-7">
				<p className="text-sm font-medium text-brand">{MARKETING_HOME_HERO.eyebrow}</p>
				<h1
					id="home-hero-heading"
					className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
				>
					{MARKETING_HOME_HERO.heading}
				</h1>
				<p className="mt-4 max-w-3xl text-lg leading-relaxed text-foreground-secondary">
					{MARKETING_HOME_HERO.body}
				</p>
				<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
					<Link
						href={MARKETING_HOME_HERO.primaryCta.href}
						className={cn(buttonVariants({size: 'lg'}), 'w-full sm:w-auto')}
					>
						{MARKETING_HOME_HERO.primaryCta.label}
					</Link>
					<Link
						href={MARKETING_HOME_HERO.secondaryCta.href}
						className={cn(buttonVariants({variant: 'outline', size: 'lg'}), 'w-full sm:w-auto')}
					>
						{MARKETING_HOME_HERO.secondaryCta.label}
					</Link>
				</div>
			</div>
			<div data-hero-visual className="relative hidden md:block lg:col-span-5">
				<MarketingProductImage
					src={HERO_IMAGE.src}
					alt={HERO_IMAGE.alt}
					className="shadow-lg"
				/>
				<ul data-hero-chips aria-label="Demo highlights" className="hidden lg:block">
					{MARKETING_HOME_HERO.chips.map((chip, index) => (
						<li
							key={chip}
							className={cn(
								'absolute flex rounded-full border border-border bg-surface p-1 shadow-md',
								CHIP_POSITION_CLASS_NAME[index],
							)}
						>
							<Badge tone="neutral" className="rounded-full">
								{chip}
							</Badge>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
