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
import {MarketingProductVisual} from '@/components/marketing/marketing-product-visual';
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
					<MarketingProductVisual
						src={MARKETING_DEMO_LOGIN_PREVIEW.image.src}
						alt={MARKETING_DEMO_LOGIN_PREVIEW.image.alt}
						caption={MARKETING_DEMO_LOGIN_PREVIEW.caption}
						frameClassName="mt-4 min-h-[16rem] bg-subtle sm:min-h-[17.5rem]"
						imageClassName="h-auto max-h-[540px] w-full object-contain object-top"
					/>
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
