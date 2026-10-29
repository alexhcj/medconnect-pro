import {Server} from 'lucide-react';
import {
	MARKETING_ABOUT_ARCHITECTURE,
	MARKETING_ABOUT_CTA,
	MARKETING_ABOUT_HERO,
	MARKETING_ABOUT_PURPOSE,
	MARKETING_ABOUT_STATE,
} from '@/components/marketing/marketing-about-copy';
import {MarketingCtaBand} from '@/components/marketing/marketing-cta-band';
import {MarketingHero} from '@/components/marketing/marketing-hero';
import {MarketingLinkCard} from '@/components/marketing/marketing-link-card';
import {MarketingRoadmapBoard} from '@/components/marketing/marketing-roadmap-board';
import {
	MarketingSection,
	marketingSectionGridClassName,
} from '@/components/marketing/marketing-section';
import {MarketingStatusCard} from '@/components/marketing/marketing-status-card';
import {RoleTagList} from '@/components/ui/role-tag';

export function MarketingAbout() {
	return (
		<div className="bg-surface">
			<MarketingHero
				headingId={MARKETING_ABOUT_HERO.headingId}
				eyebrow={MARKETING_ABOUT_HERO.eyebrow}
				heading={MARKETING_ABOUT_HERO.heading}
				body={MARKETING_ABOUT_HERO.body}
				primaryCta={MARKETING_ABOUT_HERO.primaryCta}
				secondaryCta={MARKETING_ABOUT_HERO.secondaryCta}
			/>
			<div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 sm:px-6 lg:space-y-12 lg:px-8 lg:pb-24">
				<MarketingSection
					headingId={MARKETING_ABOUT_PURPOSE.headingId}
					title={MARKETING_ABOUT_PURPOSE.heading}
				>
					<p className="text-base leading-relaxed text-foreground-secondary">
						{MARKETING_ABOUT_PURPOSE.body}
					</p>
					<div className="mt-4">
						<RoleTagList roles={MARKETING_ABOUT_PURPOSE.roles} />
					</div>
				</MarketingSection>

				<MarketingSection
					headingId={MARKETING_ABOUT_ARCHITECTURE.headingId}
					title={MARKETING_ABOUT_ARCHITECTURE.heading}
				>
					<ul className={marketingSectionGridClassName(3)}>
						{MARKETING_ABOUT_ARCHITECTURE.items.map((item) => (
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
					<p className="mt-6 text-base leading-relaxed text-foreground-secondary">
						{MARKETING_ABOUT_ARCHITECTURE.note}
					</p>
					<MarketingLinkCard
						className="mt-6"
						href={MARKETING_ABOUT_ARCHITECTURE.link.href}
						title={MARKETING_ABOUT_ARCHITECTURE.link.title}
						description={MARKETING_ABOUT_ARCHITECTURE.link.description}
						icon={Server}
					/>
				</MarketingSection>

				<MarketingSection
					headingId={MARKETING_ABOUT_STATE.headingId}
					title={MARKETING_ABOUT_STATE.heading}
				>
					<MarketingRoadmapBoard
						columns={MARKETING_ABOUT_STATE.columns}
						paused={MARKETING_ABOUT_STATE.paused}
					/>
				</MarketingSection>

				<MarketingCtaBand
					headingId={MARKETING_ABOUT_CTA.headingId}
					heading={MARKETING_ABOUT_CTA.heading}
					body={MARKETING_ABOUT_CTA.body}
					primaryCta={MARKETING_ABOUT_CTA.primaryCta}
					secondaryCta={MARKETING_ABOUT_CTA.secondaryCta}
					rowFrom="lg"
				/>
			</div>
		</div>
	);
}
