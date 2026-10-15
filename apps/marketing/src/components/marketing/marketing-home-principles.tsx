import {Card, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {
	MarketingSection,
	marketingSectionGridClassName,
} from '@/components/marketing/marketing-section';

interface PrincipleItem {
	title: string;
	description: string;
}

interface MarketingHomePrinciplesProps {
	headingId: string;
	title: string;
	items: readonly PrincipleItem[];
}

export function MarketingHomePrinciples({headingId, title, items}: MarketingHomePrinciplesProps) {
	return (
		<MarketingSection headingId={headingId} title={title}>
			<ul className={marketingSectionGridClassName(3)}>
				{items.map((item) => (
					<li key={item.title}>
						<Card className="h-full">
							<CardHeader>
								<CardTitle>{item.title}</CardTitle>
								<CardDescription className="text-base leading-relaxed">
									{item.description}
								</CardDescription>
							</CardHeader>
						</Card>
					</li>
				))}
			</ul>
		</MarketingSection>
	);
}
