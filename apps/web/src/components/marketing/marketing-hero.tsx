import Link from 'next/link';
import {buttonVariants} from '@/components/ui/button';
import {cn} from '@/lib/utils/utils';

export interface MarketingHeroCta {
	label: string;
	href: string;
}

interface MarketingHeroProps {
	headingId: string;
	eyebrow: string;
	heading: string;
	body: string;
	primaryCta: MarketingHeroCta;
	secondaryCta: MarketingHeroCta;
	stackUntilLg?: boolean;
}

export function MarketingHero({
	headingId,
	eyebrow,
	heading,
	body,
	primaryCta,
	secondaryCta,
	stackUntilLg = false,
}: MarketingHeroProps) {
	return (
		<section aria-labelledby={headingId} className="bg-surface">
			<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
				<p className="text-sm font-medium text-brand">{eyebrow}</p>
				<h1
					id={headingId}
					className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
				>
					{heading}
				</h1>
				<p className="mt-4 max-w-3xl text-lg leading-relaxed text-foreground-secondary">{body}</p>
				<div
					className={cn(
						'mt-8 flex flex-col gap-3',
						stackUntilLg
							? 'items-start lg:flex-row lg:items-center'
							: 'md:flex-row md:items-center',
					)}
				>
					<Link href={primaryCta.href} className={cn(buttonVariants({size: 'lg'}))}>
						{primaryCta.label}
					</Link>
					<Link
						href={secondaryCta.href}
						className={cn(buttonVariants({variant: 'outline', size: 'lg'}))}
					>
						{secondaryCta.label}
					</Link>
				</div>
			</div>
		</section>
	);
}
