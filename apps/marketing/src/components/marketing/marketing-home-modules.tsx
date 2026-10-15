import {Card, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {MARKETING_HOME_MODULES} from '@/components/marketing/marketing-home-copy';
import {
	MarketingSection,
	marketingSectionGridClassName,
} from '@/components/marketing/marketing-section';

export function MarketingHomeModules() {
	return (
		<MarketingSection
			headingId={MARKETING_HOME_MODULES.headingId}
			title={MARKETING_HOME_MODULES.heading}
		>
			<ul className={marketingSectionGridClassName(3)}>
				{MARKETING_HOME_MODULES.items.map((item) => (
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
