import {
	MARKETING_ABOUT_ARCHITECTURE,
	MARKETING_ABOUT_CTA,
	MARKETING_ABOUT_HERO,
	MARKETING_ABOUT_PURPOSE,
	MARKETING_ABOUT_STACK,
	MARKETING_ABOUT_STATE,
} from '@/components/marketing/marketing-about-copy';
import {MarketingCtaBand} from '@/components/marketing/marketing-cta-band';
import {MarketingHero} from '@/components/marketing/marketing-hero';
import {
	MarketingSection,
	marketingSectionGridClassName,
} from '@/components/marketing/marketing-section';
import {MarketingStatusCard} from '@/components/marketing/marketing-status-card';

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
				stackUntilLg
			/>
			<div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 sm:px-6 lg:space-y-12 lg:px-8 lg:pb-24">
				<MarketingSection
					headingId={MARKETING_ABOUT_PURPOSE.headingId}
					title={MARKETING_ABOUT_PURPOSE.heading}
				>
					<p className="text-base leading-relaxed text-foreground-secondary">
						{MARKETING_ABOUT_PURPOSE.body}
					</p>
					<ul className="mt-4 flex flex-wrap gap-2">
						{MARKETING_ABOUT_PURPOSE.roles.map((role) => (
							<li
								key={role}
								className="inline-flex min-h-11 items-center rounded-full bg-subtle px-4 text-sm font-medium text-foreground"
							>
								{role}
							</li>
						))}
					</ul>
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
				</MarketingSection>

				<MarketingSection
					headingId={MARKETING_ABOUT_STATE.headingId}
					title={MARKETING_ABOUT_STATE.heading}
				>
					<ul className={marketingSectionGridClassName(3)}>
						{MARKETING_ABOUT_STATE.items.map((item) => (
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
					headingId={MARKETING_ABOUT_STACK.headingId}
					title={MARKETING_ABOUT_STACK.heading}
				>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-md border border-border bg-surface p-6">
							<p className="text-lg font-semibold text-brand">
								{MARKETING_ABOUT_STACK.current.title}
							</p>
							<p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
								{MARKETING_ABOUT_STACK.current.body}
							</p>
						</div>
						<div className="rounded-md bg-subtle p-6">
							<p className="text-lg font-semibold text-foreground">
								{MARKETING_ABOUT_STACK.planned.title}
							</p>
							<p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
								{MARKETING_ABOUT_STACK.planned.body}
							</p>
						</div>
					</div>
				</MarketingSection>

				<MarketingCtaBand
					headingId={MARKETING_ABOUT_CTA.headingId}
					heading={MARKETING_ABOUT_CTA.heading}
					body={MARKETING_ABOUT_CTA.body}
					primaryCta={MARKETING_ABOUT_CTA.primaryCta}
					secondaryCta={MARKETING_ABOUT_CTA.secondaryCta}
					stackUntilLg
				/>
			</div>
		</div>
	);
}
