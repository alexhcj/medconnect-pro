import {MarketingCtaBand} from '@/components/marketing/marketing-cta-band';
import {MarketingHero} from '@/components/marketing/marketing-hero';
import {MarketingPlatformModules} from '@/components/marketing/marketing-platform-modules';
import {
	MARKETING_PLATFORM_CTA,
	MARKETING_PLATFORM_HERO,
} from '@/components/marketing/marketing-platform-copy';

export function MarketingPlatform() {
	return (
		<div className="bg-surface">
			<MarketingHero
				headingId={MARKETING_PLATFORM_HERO.headingId}
				eyebrow={MARKETING_PLATFORM_HERO.eyebrow}
				heading={MARKETING_PLATFORM_HERO.heading}
				body={MARKETING_PLATFORM_HERO.body}
				primaryCta={MARKETING_PLATFORM_HERO.primaryCta}
				secondaryCta={MARKETING_PLATFORM_HERO.secondaryCta}
			/>
			<div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 sm:px-6 lg:space-y-12 lg:px-8 lg:pb-24">
				<MarketingPlatformModules />
				<MarketingCtaBand
					headingId={MARKETING_PLATFORM_CTA.headingId}
					heading={MARKETING_PLATFORM_CTA.heading}
					body={MARKETING_PLATFORM_CTA.body}
					primaryCta={MARKETING_PLATFORM_CTA.primaryCta}
					secondaryCta={MARKETING_PLATFORM_CTA.secondaryCta}
				/>
			</div>
		</div>
	);
}
