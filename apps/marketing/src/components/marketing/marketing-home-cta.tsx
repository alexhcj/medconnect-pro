import Link from 'next/link';
import {buttonVariants} from '@/components/ui/button';
import {MARKETING_HOME_CTA} from '@/components/marketing/marketing-home-copy';
import {cn} from '@/lib/utils/utils';

export function MarketingHomeCta() {
	return (
		<section
			aria-labelledby={MARKETING_HOME_CTA.headingId}
			className="rounded-xl bg-brand-subtle px-6 py-10 text-center sm:px-10 sm:py-12"
		>
			<h2
				id={MARKETING_HOME_CTA.headingId}
				className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
			>
				{MARKETING_HOME_CTA.heading}
			</h2>
			<p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-foreground-secondary">
				{MARKETING_HOME_CTA.body}
			</p>
			<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<Link href={MARKETING_HOME_CTA.primaryCta.href} className={cn(buttonVariants({size: 'lg'}))}>
					{MARKETING_HOME_CTA.primaryCta.label}
				</Link>
				<Link
					href={MARKETING_HOME_CTA.secondaryCta.href}
					className={cn(buttonVariants({variant: 'outline', size: 'lg'}))}
				>
					{MARKETING_HOME_CTA.secondaryCta.label}
				</Link>
			</div>
		</section>
	);
}
