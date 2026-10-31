import {ArrowDown, ArrowRight} from 'lucide-react';
import {
	MARKETING_ARCHITECTURE_CTA,
	MARKETING_ARCHITECTURE_FLOW,
	MARKETING_ARCHITECTURE_HERO,
	MARKETING_ARCHITECTURE_MAP,
	MARKETING_ARCHITECTURE_STACK,
} from '@/components/marketing/marketing-architecture-copy';
import {MarketingArchitectureMap} from '@/components/marketing/marketing-architecture-map';
import {MarketingCtaBand} from '@/components/marketing/marketing-cta-band';
import {MarketingHero} from '@/components/marketing/marketing-hero';
import {MarketingSection} from '@/components/marketing/marketing-section';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';

export function MarketingArchitecture() {
	return (
		<div className="bg-surface">
			<MarketingHero
				headingId={MARKETING_ARCHITECTURE_HERO.headingId}
				eyebrow={MARKETING_ARCHITECTURE_HERO.eyebrow}
				heading={MARKETING_ARCHITECTURE_HERO.heading}
				body={MARKETING_ARCHITECTURE_HERO.body}
				primaryCta={MARKETING_ARCHITECTURE_HERO.primaryCta}
				secondaryCta={MARKETING_ARCHITECTURE_HERO.secondaryCta}
			/>
			<div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 sm:px-6 lg:space-y-12 lg:px-8 lg:pb-24">
				<MarketingSection
					headingId={MARKETING_ARCHITECTURE_MAP.headingId}
					title={MARKETING_ARCHITECTURE_MAP.heading}
					className="scroll-mt-6"
				>
					<p className="text-base leading-relaxed text-foreground-secondary">
						{MARKETING_ARCHITECTURE_MAP.intro}
					</p>
					<div className="mt-6">
						<MarketingArchitectureMap />
					</div>
				</MarketingSection>

				<MarketingSection
					headingId={MARKETING_ARCHITECTURE_FLOW.headingId}
					title={MARKETING_ARCHITECTURE_FLOW.heading}
				>
					<p className="text-base leading-relaxed text-foreground-secondary">
						{MARKETING_ARCHITECTURE_FLOW.intro}
					</p>
					<ol className="mt-6 grid gap-2 md:grid-cols-3 md:gap-4 lg:flex lg:gap-2">
						{MARKETING_ARCHITECTURE_FLOW.steps.map((step, index) => (
							<li
								key={step.title}
								className="flex flex-col items-center gap-2 md:block lg:flex lg:flex-1 lg:flex-row lg:items-stretch"
							>
								{index > 0 ? (
									<>
										<ArrowDown aria-hidden className="size-4 shrink-0 text-brand md:hidden" />
										<ArrowRight
											aria-hidden
											className="hidden size-4 shrink-0 self-center text-brand lg:block"
										/>
									</>
								) : null}
								<Card className="h-full w-full lg:flex-1">
									<CardHeader className="p-4 md:p-6">
										<p className="text-2xl font-semibold text-brand" aria-hidden>
											{index + 1}
										</p>
										<CardTitle className="pt-2 text-base">{step.title}</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3 p-4 pt-0 md:p-6 md:pt-0">
										<p className="text-sm leading-relaxed text-foreground-secondary">
											{step.description}
										</p>
										<p className="text-sm font-medium text-foreground">
											Enforced in: {step.enforcedIn}
										</p>
									</CardContent>
								</Card>
							</li>
						))}
					</ol>
				</MarketingSection>

				<MarketingSection
					headingId={MARKETING_ARCHITECTURE_STACK.headingId}
					title={MARKETING_ARCHITECTURE_STACK.heading}
				>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-md border border-border bg-surface p-6">
							<p className="text-lg font-semibold text-brand">
								{MARKETING_ARCHITECTURE_STACK.current.title}
							</p>
							<p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
								{MARKETING_ARCHITECTURE_STACK.current.body}
							</p>
						</div>
						<div className="rounded-md border border-dashed border-border-strong bg-warning-subtle p-6">
							<p className="text-lg font-semibold text-foreground">
								{MARKETING_ARCHITECTURE_STACK.planned.title}
							</p>
							<p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
								{MARKETING_ARCHITECTURE_STACK.planned.body}
							</p>
						</div>
					</div>
				</MarketingSection>

				<MarketingCtaBand
					headingId={MARKETING_ARCHITECTURE_CTA.headingId}
					heading={MARKETING_ARCHITECTURE_CTA.heading}
					body={MARKETING_ARCHITECTURE_CTA.body}
					primaryCta={MARKETING_ARCHITECTURE_CTA.primaryCta}
					secondaryCta={MARKETING_ARCHITECTURE_CTA.secondaryCta}
					rowFrom="lg"
				/>
			</div>
		</div>
	);
}
