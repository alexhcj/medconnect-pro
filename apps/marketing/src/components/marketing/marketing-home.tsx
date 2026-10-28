import {MarketingCtaBand} from '@/components/marketing/marketing-cta-band';
import {
	MARKETING_HOME_CTA,
	MARKETING_HOME_SECURITY_PRINCIPLES,
	MARKETING_HOME_UX_PRINCIPLES,
} from '@/components/marketing/marketing-home-copy';
import {MarketingHomeHero} from '@/components/marketing/marketing-home-hero';
import {MarketingHomeModules} from '@/components/marketing/marketing-home-modules';
import {MarketingHomePreview} from '@/components/marketing/marketing-home-preview';
import {MarketingHomePrinciples} from '@/components/marketing/marketing-home-principles';
import {MarketingHomeRoles} from '@/components/marketing/marketing-home-roles';
import {MarketingHomeWorkflow} from '@/components/marketing/marketing-home-workflow';

export function MarketingHome() {
	return (
		<div className="bg-surface">
			<MarketingHomeHero />
			<div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 sm:px-6 lg:space-y-12 lg:px-8 lg:pb-24">
				<MarketingHomeModules />
				<MarketingHomeWorkflow />
				<MarketingHomePreview />
				<MarketingHomePrinciples
					headingId={MARKETING_HOME_UX_PRINCIPLES.headingId}
					title={MARKETING_HOME_UX_PRINCIPLES.heading}
					items={MARKETING_HOME_UX_PRINCIPLES.items}
				/>
				<MarketingHomePrinciples
					headingId={MARKETING_HOME_SECURITY_PRINCIPLES.headingId}
					title={MARKETING_HOME_SECURITY_PRINCIPLES.heading}
					items={MARKETING_HOME_SECURITY_PRINCIPLES.items}
				/>
				<MarketingHomeRoles />
				<MarketingCtaBand
					headingId={MARKETING_HOME_CTA.headingId}
					heading={MARKETING_HOME_CTA.heading}
					body={MARKETING_HOME_CTA.body}
					primaryCta={MARKETING_HOME_CTA.primaryCta}
					secondaryCta={MARKETING_HOME_CTA.secondaryCta}
					rowFrom="sm"
				/>
			</div>
		</div>
	);
}
