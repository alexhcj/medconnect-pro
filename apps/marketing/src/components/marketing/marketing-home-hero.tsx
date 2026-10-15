import Link from 'next/link';
import {buttonVariants} from '@/components/ui/button';
import {MARKETING_HOME_HERO} from '@/components/marketing/marketing-home-copy';
import {cn} from '@/lib/utils/utils';

export function MarketingHomeHero() {
	return (
		<section aria-labelledby="home-hero-heading" className="bg-surface">
			<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
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
		</section>
	);
}
