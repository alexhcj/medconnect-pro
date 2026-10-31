import {
	type MarketingStatusLabel,
	marketingStatusTone,
} from '@/components/marketing/marketing-status-tones';
import {Badge} from '@/components/ui/badge';

export interface MarketingRoadmapItem {
	title: string;
	description: string;
}

export interface MarketingRoadmapColumn {
	label: MarketingStatusLabel;
	items: readonly MarketingRoadmapItem[];
}

interface MarketingRoadmapBoardProps {
	columns: readonly MarketingRoadmapColumn[];
	paused: {label: MarketingStatusLabel; text: string};
}

/**
 * Shipped / In progress / Up next columns plus one full-width Paused line. Columns stack below
 * lg and sit three-up from lg, so no column is ever alone on a row.
 */
export function MarketingRoadmapBoard({columns, paused}: MarketingRoadmapBoardProps) {
	return (
		<div>
			<div className="grid gap-4 lg:grid-cols-3">
				{columns.map((column) => (
					<div
						key={column.label}
						className="rounded-lg border border-border bg-surface p-5"
					>
						<h3>
							<Badge tone={marketingStatusTone(column.label)} dot>
								{column.label}
							</Badge>
						</h3>
						<ul aria-label={column.label} className="mt-4 space-y-4">
							{column.items.map((item) => (
								<li key={item.title}>
									<p className="text-sm font-medium text-foreground">{item.title}</p>
									<p className="mt-1 text-sm leading-relaxed text-foreground-secondary">
										{item.description}
									</p>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
			<div className="mt-4 flex items-start gap-3 rounded-md bg-subtle px-5 py-4">
				<Badge tone={marketingStatusTone(paused.label)} className="shrink-0">
					{paused.label}
				</Badge>
				<p className="text-sm leading-relaxed text-foreground-secondary">{paused.text}</p>
			</div>
		</div>
	);
}
