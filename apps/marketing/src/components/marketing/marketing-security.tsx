import {MarketingCallout} from '@/components/marketing/marketing-callout';
import {MarketingCtaBand} from '@/components/marketing/marketing-cta-band';
import {MarketingHero} from '@/components/marketing/marketing-hero';
import {
	MARKETING_SECURITY_AUTHORIZATION,
	MARKETING_SECURITY_CALLOUT,
	MARKETING_SECURITY_CONTROLS,
	MARKETING_SECURITY_CTA,
	MARKETING_SECURITY_HERO,
	MARKETING_SECURITY_NOT_IN_DEMO,
} from '@/components/marketing/marketing-security-copy';
import {
	MarketingSection,
	marketingSectionGridClassName,
} from '@/components/marketing/marketing-section';
import {MarketingStatusCard} from '@/components/marketing/marketing-status-card';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';

export function MarketingSecurity() {
	return (
		<div className="bg-surface">
			<MarketingHero
				headingId={MARKETING_SECURITY_HERO.headingId}
				eyebrow={MARKETING_SECURITY_HERO.eyebrow}
				heading={MARKETING_SECURITY_HERO.heading}
				body={MARKETING_SECURITY_HERO.body}
				primaryCta={MARKETING_SECURITY_HERO.primaryCta}
				secondaryCta={MARKETING_SECURITY_HERO.secondaryCta}
			/>
			<div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 sm:px-6 lg:space-y-12 lg:px-8 lg:pb-24">
				<MarketingCallout
					headingId={MARKETING_SECURITY_CALLOUT.headingId}
					heading={MARKETING_SECURITY_CALLOUT.heading}
					body={MARKETING_SECURITY_CALLOUT.body}
				/>

				<MarketingSection
					headingId={MARKETING_SECURITY_CONTROLS.headingId}
					title={MARKETING_SECURITY_CONTROLS.heading}
				>
					<ul className={marketingSectionGridClassName(3)}>
						{MARKETING_SECURITY_CONTROLS.items.map((item) => (
							<li key={item.title}>
								<MarketingStatusCard
									title={item.title}
									description={item.description}
									detail={item.detail}
									status={item.status}
								/>
							</li>
						))}
					</ul>
				</MarketingSection>

				<MarketingSection
					headingId={MARKETING_SECURITY_AUTHORIZATION.headingId}
					title={MARKETING_SECURITY_AUTHORIZATION.heading}
				>
					<p className="text-base leading-relaxed text-foreground-secondary">
						{MARKETING_SECURITY_AUTHORIZATION.note}
					</p>
					<ol className={`mt-6 ${marketingSectionGridClassName(5)}`}>
						{MARKETING_SECURITY_AUTHORIZATION.steps.map((step, index) => (
							<li key={step.title}>
								<Card className="h-full bg-subtle shadow-none">
									<CardHeader>
										<p className="text-2xl font-semibold text-brand" aria-hidden>
											{index + 1}
										</p>
										<CardTitle className="pt-2 text-base">{step.title}</CardTitle>
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

				<MarketingSection
					headingId={MARKETING_SECURITY_NOT_IN_DEMO.headingId}
					title={MARKETING_SECURITY_NOT_IN_DEMO.heading}
				>
					<ul className={marketingSectionGridClassName(3)}>
						{MARKETING_SECURITY_NOT_IN_DEMO.items.map((item) => (
							<li key={item.title}>
								<MarketingStatusCard
									title={item.title}
									description={item.description}
									detail={item.detail}
									status={item.status}
								/>
							</li>
						))}
					</ul>
				</MarketingSection>

				<MarketingCtaBand
					headingId={MARKETING_SECURITY_CTA.headingId}
					heading={MARKETING_SECURITY_CTA.heading}
					body={MARKETING_SECURITY_CTA.body}
					primaryCta={MARKETING_SECURITY_CTA.primaryCta}
					secondaryCta={MARKETING_SECURITY_CTA.secondaryCta}
					stackUntilLg
				/>
			</div>
		</div>
	);
}
