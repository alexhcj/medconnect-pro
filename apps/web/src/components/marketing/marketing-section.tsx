import {cn} from '@/lib/utils/utils';

interface MarketingSectionProps {
	headingId: string;
	title: string;
	children: React.ReactNode;
	className?: string;
	actions?: React.ReactNode;
}

export function MarketingSection({
	headingId,
	title,
	children,
	className,
	actions,
}: MarketingSectionProps) {
	return (
		<section aria-labelledby={headingId} className={className}>
			<div className="relative flex min-h-10 items-center">
				<h2
					id={headingId}
					className={cn(
						'text-2xl font-semibold tracking-tight text-foreground',
						actions ? 'pr-24' : undefined,
					)}
				>
					{title}
				</h2>
				{actions ? (
					<div className="absolute right-0 top-1/2 flex -translate-y-1/2 gap-2">{actions}</div>
				) : null}
			</div>
			<div className="mt-6">{children}</div>
		</section>
	);
}

export function marketingSectionGridClassName(columns: 3 | 4 | 5): string {
	return cn(
		'grid gap-4',
		columns === 5
			? 'sm:grid-cols-2 lg:grid-cols-5'
			: columns === 4
				? 'lg:grid-cols-4'
				: 'sm:grid-cols-2 lg:grid-cols-3',
	);
}
