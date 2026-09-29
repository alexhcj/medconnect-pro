import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {MARKETING_HOME_WORKFLOW} from '@/components/marketing/marketing-home-copy';
import {
	MarketingSection,
	marketingSectionGridClassName,
} from '@/components/marketing/marketing-section';

export function MarketingHomeWorkflow() {
	return (
		<MarketingSection
			headingId={MARKETING_HOME_WORKFLOW.headingId}
			title={MARKETING_HOME_WORKFLOW.heading}
		>
			<ol className={marketingSectionGridClassName(4)}>
				{MARKETING_HOME_WORKFLOW.steps.map((step, index) => (
					<li key={step.title}>
						<Card className="h-full">
							<CardHeader>
								<p className="text-2xl font-semibold text-brand" aria-hidden>
									{index + 1}
								</p>
								<CardTitle className="pt-2">{step.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed text-foreground-secondary">
									{step.description}
								</p>
							</CardContent>
						</Card>
					</li>
				))}
			</ol>
		</MarketingSection>
	);
}
