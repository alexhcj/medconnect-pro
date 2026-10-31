import Link from 'next/link';
import type {LucideIcon} from 'lucide-react';
import {ArrowRight} from 'lucide-react';
import {cn} from '@/lib/utils/utils';

interface MarketingLinkCardProps {
	href: string;
	title: string;
	description?: string;
	icon?: LucideIcon;
	className?: string;
}

/** The whole card is one link. Always shows an arrow so it is never mistaken for a Badge. */
export function MarketingLinkCard({
	href,
	title,
	description,
	icon: Icon,
	className,
}: MarketingLinkCardProps) {
	return (
		<Link
			href={href}
			className={cn(
				'group flex min-h-11 items-center gap-4 rounded-lg border border-border bg-surface p-6 text-foreground shadow-sm transition-shadow',
				'hover:border-border-strong hover:shadow-md',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
				className,
			)}
		>
			{Icon ? <Icon aria-hidden className="size-5 shrink-0 text-brand" /> : null}
			<span className="min-w-0 flex-1">
				<span className="block text-base font-semibold leading-snug">{title}</span>
				{description ? (
					<>
						{' '}
						<span className="mt-1.5 block text-sm leading-relaxed text-foreground-secondary">
							{description}
						</span>
					</>
				) : null}
			</span>
			<ArrowRight
				aria-hidden
				className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5"
			/>
		</Link>
	);
}
