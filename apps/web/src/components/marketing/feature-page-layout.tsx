import Link from 'next/link';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {MarketingCtaBand, type MarketingCtaBandLink} from '@/components/marketing/marketing-cta-band';
import {MarketingHero, type MarketingHeroCta} from '@/components/marketing/marketing-hero';
import {
	MarketingSection,
	marketingSectionGridClassName,
} from '@/components/marketing/marketing-section';

export interface FeaturePageCapability {
	title: string;
	description: string;
}

export interface FeaturePageWalkthrough {
	heading: string;
	headingId: string;
	caption: string;
	slotLabel: string;
}

export interface FeaturePageWorkflowStep {
	title: string;
	description: string;
}

export interface FeaturePageRelatedLink {
	label: string;
	href: string;
}

export interface FeaturePageLayoutProps {
	hero: {
		headingId: string;
		eyebrow: string;
		heading: string;
		body: string;
		primaryCta: MarketingHeroCta;
		secondaryCta: MarketingHeroCta;
	};
	capabilities: {
		heading: string;
		headingId: string;
		items: readonly FeaturePageCapability[];
	};
	walkthrough: FeaturePageWalkthrough;
	workflow: {
		heading: string;
		headingId: string;
		steps: readonly FeaturePageWorkflowStep[];
	};
	related: {
		heading: string;
		headingId: string;
		links: readonly FeaturePageRelatedLink[];
	};
	cta: {
		headingId: string;
		heading: string;
		body: string;
		primaryCta: MarketingCtaBandLink;
		secondaryCta: MarketingCtaBandLink;
	};
}

export function FeaturePageLayout({
	hero,
	capabilities,
	walkthrough,
	workflow,
	related,
	cta,
}: FeaturePageLayoutProps) {
	return (
		<div className="bg-surface">
			<MarketingHero
				headingId={hero.headingId}
				eyebrow={hero.eyebrow}
				heading={hero.heading}
				body={hero.body}
				primaryCta={hero.primaryCta}
				secondaryCta={hero.secondaryCta}
			/>
			<div className="mx-auto max-w-6xl space-y-10 px-4 pb-16 sm:px-6 lg:space-y-12 lg:px-8 lg:pb-24">
				<MarketingSection headingId={capabilities.headingId} title={capabilities.heading}>
					<ul className={marketingSectionGridClassName(3)}>
						{capabilities.items.map((item) => (
							<li key={item.title}>
								<Card className="h-full">
									<CardHeader>
										<CardTitle className="text-base">{item.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm leading-relaxed text-foreground-secondary">
											{item.description}
										</p>
									</CardContent>
								</Card>
							</li>
						))}
					</ul>
				</MarketingSection>

				<MarketingSection headingId={walkthrough.headingId} title={walkthrough.heading}>
					<p className="text-sm text-foreground-secondary">{walkthrough.caption}</p>
					<div
						className="mt-4 flex min-h-[16rem] items-center justify-center rounded-xl border border-border bg-subtle px-6 py-16 text-center sm:min-h-[20rem] lg:min-h-[24rem]"
						role="img"
						aria-label={walkthrough.slotLabel}
					>
						<p className="max-w-md text-sm text-foreground-muted">{walkthrough.slotLabel}</p>
					</div>
				</MarketingSection>

				<MarketingSection headingId={workflow.headingId} title={workflow.heading}>
					<ol className={marketingSectionGridClassName(4)}>
						{workflow.steps.map((step, index) => (
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

				<section aria-labelledby={related.headingId}>
					<h2
						id={related.headingId}
						className="text-2xl font-semibold tracking-tight text-foreground"
					>
						{related.heading}
					</h2>
					<ul className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-base text-foreground-secondary">
						{related.links.map((link, index) => (
							<li key={link.href} className="flex items-center gap-2">
								{index > 0 ? (
									<span aria-hidden className="text-foreground-muted">
										·
									</span>
								) : null}
								<Link
									href={link.href}
									className="rounded-md font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</section>

				<MarketingCtaBand
					headingId={cta.headingId}
					heading={cta.heading}
					body={cta.body}
					primaryCta={cta.primaryCta}
					secondaryCta={cta.secondaryCta}
				/>
			</div>
		</div>
	);
}
