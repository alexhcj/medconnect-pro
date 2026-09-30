import Link from 'next/link';
import {buttonVariants} from '@/components/ui/button';
import {cn} from '@/lib/utils/utils';

export interface MarketingCtaBandLink {
	label: string;
	href: string;
}

interface MarketingCtaBandProps {
	headingId: string;
	heading: string;
	body: string;
	primaryCta: MarketingCtaBandLink;
	secondaryCta: MarketingCtaBandLink;
	stackUntilLg?: boolean;
}

export function MarketingCtaBand({
	headingId,
	heading,
	body,
	primaryCta,
	secondaryCta,
	stackUntilLg = false,
}: MarketingCtaBandProps) {
	return (
		<section
			aria-labelledby={headingId}
			className="rounded-xl bg-brand-subtle px-6 py-10 text-center sm:px-10 sm:py-12"
		>
			<h2
				id={headingId}
				className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
			>
				{heading}
			</h2>
			<p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-foreground-secondary">
				{body}
			</p>
			<div
				className={cn(
					'mt-8 flex flex-col items-center justify-center gap-3',
					stackUntilLg ? 'lg:flex-row' : 'md:flex-row',
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
		</section>
	);
}
