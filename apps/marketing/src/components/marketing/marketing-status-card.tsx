import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {
	type MarketingStatusLabel,
	marketingStatusTone,
} from '@/components/marketing/marketing-status-tones';
import {Badge} from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {cn} from '@/lib/utils/utils';

export interface MarketingStatusCardLink {
	label: string;
	href: string;
}

export interface MarketingStatusCardProps {
	title: string;
	description: string;
	detail: string;
	status: MarketingStatusLabel | MarketingStatusCardLink;
}

/**
 * A string status renders as a static Badge. A link status makes the whole card one link,
 * with the route and an arrow in the footer so it is never mistaken for a Badge.
 */
export function MarketingStatusCard({
	title,
	description,
	detail,
	status,
}: MarketingStatusCardProps) {
	const isLink = typeof status !== 'string';
	const card = (
		<Card
			className={cn(
				'h-full',
				isLink && 'transition-shadow group-hover:border-border-strong group-hover:shadow-md',
			)}
		>
			<CardHeader>
				<CardTitle className="text-base leading-snug">{title}</CardTitle>
				<CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-sm leading-relaxed text-foreground">{detail}</p>
			</CardContent>
			<CardFooter className={cn(isLink && 'justify-between gap-2')}>
				{isLink ? (
					<>
						<span className="min-w-0 break-words text-sm font-medium text-brand">
							{status.label}
						</span>
						<ArrowRight
							aria-hidden
							className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5"
						/>
					</>
				) : (
					<Badge tone={marketingStatusTone(status)}>{status}</Badge>
				)}
			</CardFooter>
		</Card>
	);

	if (!isLink) return card;

	return (
		<Link
			href={status.href}
			className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
		>
			{card}
		</Link>
	);
}
