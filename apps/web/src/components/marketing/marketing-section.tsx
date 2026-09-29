import {cn} from '@/lib/utils/utils';

interface MarketingSectionProps {
	headingId: string;
	title: string;
	children: React.ReactNode;
	className?: string;
}

export function MarketingSection({headingId, title, children, className}: MarketingSectionProps) {
	return (
		<section aria-labelledby={headingId} className={className}>
			<h2
				id={headingId}
				className="text-2xl font-semibold tracking-tight text-foreground"
			>
				{title}
			</h2>
			<div className="mt-6">{children}</div>
		</section>
	);
}

export function marketingSectionGridClassName(columns: 3 | 4): string {
	return cn(
		'grid gap-4',
		columns === 4 ? 'lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3',
	);
}
