import Link from 'next/link';
import type {ReactNode} from 'react';
import {ArrowRight} from 'lucide-react';
import {cn} from '@/lib/utils/utils';

export interface MarketingSplitSectionLink {
	label: string;
	href: string;
}

interface MarketingSplitSectionProps {
	headingId: string;
	title: string;
	intro?: string;
	link?: MarketingSplitSectionLink;
	/** Swaps the columns from `lg`. DOM and reading order stay lead-first. */
	reverse?: boolean;
	children: ReactNode;
	className?: string;
}

export function MarketingSplitSection({
	headingId,
	title,
	intro,
	link,
	reverse = false,
	children,
	className,
}: MarketingSplitSectionProps) {
	return (
		<section
			aria-labelledby={headingId}
			className={cn('grid gap-8 lg:grid-cols-12 lg:gap-12', className)}
		>
			<div className={cn('lg:col-span-5', reverse ? 'lg:order-2' : undefined)}>
				<h2 id={headingId} className="text-2xl font-semibold tracking-tight text-foreground">
					{title}
				</h2>
				{intro ? (
					<p className="mt-4 text-base leading-relaxed text-foreground-secondary">{intro}</p>
				) : null}
				{link ? (
					<Link
						href={link.href}
						className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{link.label}
						<ArrowRight aria-hidden className="size-4" />
					</Link>
				) : null}
			</div>
			<div className={cn('lg:col-span-7', reverse ? 'lg:order-1' : undefined)}>{children}</div>
		</section>
	);
}
