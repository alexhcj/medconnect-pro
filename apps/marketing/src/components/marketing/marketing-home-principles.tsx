import {Card, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {MarketingSection} from '@/components/marketing/marketing-section';

interface PrincipleItem {
	title: string;
	description: string;
}

interface MarketingHomePrinciplesProps {
	headingId: string;
	title: string;
	items: readonly PrincipleItem[];
}

/** Text-only principle cards: 3 columns from `lg`, 2 from `md` (an odd card sits alone), 1 below. */
export function MarketingHomePrinciples({headingId, title, items}: MarketingHomePrinciplesProps) {
	return (
		<MarketingSection headingId={headingId} title={title}>
			<ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{items.map((item) => (
					<li key={item.title}>
						<Card className="h-full">
							<CardHeader className="p-4 md:p-6">
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
