import {MarketingCallout} from '@/components/marketing/marketing-callout';
import {MarketingCtaBand} from '@/components/marketing/marketing-cta-band';
import {
	MARKETING_DEMO_CTA,
	MARKETING_DEMO_HERO,
	MARKETING_DEMO_HOW_TO_ENTER,
	MARKETING_DEMO_LOGIN_PREVIEW,
	MARKETING_DEMO_SAFETY,
	MARKETING_DEMO_WALKTHROUGH,
} from '@/components/marketing/marketing-demo-copy';
import {MarketingHero} from '@/components/marketing/marketing-hero';
import {
	MarketingSection,
	marketingSectionGridClassName,
} from '@/components/marketing/marketing-section';
import {MarketingStatusCard} from '@/components/marketing/marketing-status-card';

export function MarketingDemo() {
	return (
		<div className="bg-surface">
			<MarketingHero
				headingId={MARKETING_DEMO_HERO.headingId}
				eyebrow={MARKETING_DEMO_HERO.eyebrow}
				heading={MARKETING_DEMO_HERO.heading}
				body={MARKETING_DEMO_HERO.body}
				primaryCta={MARKETING_DEMO_HERO.primaryCta}
				secondaryCta={MARKETING_DEMO_HERO.secondaryCta}
				stackUntilLg
			/>
			<div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 sm:px-6 lg:space-y-12 lg:px-8 lg:pb-24">
				<MarketingSection
					headingId={MARKETING_DEMO_HOW_TO_ENTER.headingId}
					title={MARKETING_DEMO_HOW_TO_ENTER.heading}
				>
					<p className="text-base leading-relaxed text-foreground-secondary">
						{MARKETING_DEMO_HOW_TO_ENTER.body}
					</p>
				</MarketingSection>

				<MarketingSection
					headingId={MARKETING_DEMO_WALKTHROUGH.headingId}
					title={MARKETING_DEMO_WALKTHROUGH.heading}
				>
					<ul className={marketingSectionGridClassName(3)}>
						{MARKETING_DEMO_WALKTHROUGH.items.map((item) => (
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

				<MarketingCallout
					headingId={MARKETING_DEMO_SAFETY.headingId}
					heading={MARKETING_DEMO_SAFETY.heading}
					body={MARKETING_DEMO_SAFETY.body}
				/>

				<MarketingSection
					headingId={MARKETING_DEMO_LOGIN_PREVIEW.headingId}
					title={MARKETING_DEMO_LOGIN_PREVIEW.heading}
				>
					<p className="text-sm text-foreground-secondary">
						{MARKETING_DEMO_LOGIN_PREVIEW.caption}
					</p>
					<div
						className="mt-4 flex min-h-[16rem] items-center justify-center rounded-xl border border-border bg-subtle px-6 py-16 text-center sm:min-h-[17.5rem]"
						role="img"
						aria-label={MARKETING_DEMO_LOGIN_PREVIEW.slotLabel}
					>
						<p className="max-w-md text-sm text-foreground-muted">
							{MARKETING_DEMO_LOGIN_PREVIEW.slotLabel}
						</p>
					</div>
				</MarketingSection>

				<MarketingCtaBand
					headingId={MARKETING_DEMO_CTA.headingId}
					heading={MARKETING_DEMO_CTA.heading}
					body={MARKETING_DEMO_CTA.body}
					primaryCta={MARKETING_DEMO_CTA.primaryCta}
					secondaryCta={MARKETING_DEMO_CTA.secondaryCta}
					stackUntilLg
				/>
			</div>
		</div>
	);
}
