import {MarketingBand} from '@/components/marketing/marketing-band';
import {MarketingCtaBand} from '@/components/marketing/marketing-cta-band';
import {
	MARKETING_HOME_CTA,
	MARKETING_HOME_UX_PRINCIPLES,
} from '@/components/marketing/marketing-home-copy';
import {MarketingHomeHero} from '@/components/marketing/marketing-home-hero';
import {MarketingHomeModules} from '@/components/marketing/marketing-home-modules';
import {MarketingHomePreview} from '@/components/marketing/marketing-home-preview';
import {MarketingHomePrinciples} from '@/components/marketing/marketing-home-principles';
import {MarketingHomeRoles} from '@/components/marketing/marketing-home-roles';
import {MarketingHomeSecurity} from '@/components/marketing/marketing-home-security';
import {MarketingHomeWorkflow} from '@/components/marketing/marketing-home-workflow';

/** A band that follows a band of the same tone drops its top padding (Hero → Modules excepted). */
const COLLAPSED_TOP = 'pt-0 sm:pt-0 lg:pt-0';

export function MarketingHome() {
	return (
		<div className="bg-surface">
			<MarketingBand tone="surface">
				<MarketingHomeHero />
			</MarketingBand>
			<MarketingBand tone="surface">
				<MarketingHomeModules />
			</MarketingBand>
			<MarketingBand tone="canvas">
				<MarketingHomeWorkflow />
			</MarketingBand>
			<MarketingBand tone="surface">
				<MarketingHomePreview />
			</MarketingBand>
			<MarketingBand tone="canvas">
				<MarketingHomeSecurity />
			</MarketingBand>
			<MarketingBand tone="surface">
				<MarketingHomePrinciples
					headingId={MARKETING_HOME_UX_PRINCIPLES.headingId}
					title={MARKETING_HOME_UX_PRINCIPLES.heading}
					items={MARKETING_HOME_UX_PRINCIPLES.items}
				/>
			</MarketingBand>
			<MarketingBand tone="surface" className={COLLAPSED_TOP}>
				<MarketingHomeRoles />
			</MarketingBand>
			<MarketingBand tone="surface" className={COLLAPSED_TOP}>
				<MarketingCtaBand
					headingId={MARKETING_HOME_CTA.headingId}
					heading={MARKETING_HOME_CTA.heading}
					body={MARKETING_HOME_CTA.body}
					primaryCta={MARKETING_HOME_CTA.primaryCta}
					secondaryCta={MARKETING_HOME_CTA.secondaryCta}
					rowFrom="sm"
				/>
			</MarketingBand>
		</div>
	);
}
