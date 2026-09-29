import {MARKETING_HOME_PREVIEW} from '@/components/marketing/marketing-home-copy';
import {MarketingSection} from '@/components/marketing/marketing-section';

export function MarketingHomePreview() {
	return (
		<MarketingSection
			headingId={MARKETING_HOME_PREVIEW.headingId}
			title={MARKETING_HOME_PREVIEW.heading}
		>
			<p className="text-sm text-foreground-secondary">{MARKETING_HOME_PREVIEW.caption}</p>
			<div
				className="mt-4 flex min-h-[16rem] items-center justify-center rounded-xl border border-border bg-subtle px-6 py-16 text-center sm:min-h-[20rem] lg:min-h-[24rem]"
				role="img"
				aria-label={MARKETING_HOME_PREVIEW.slotLabel}
			>
				<p className="max-w-md text-sm text-foreground-muted">{MARKETING_HOME_PREVIEW.slotLabel}</p>
			</div>
		</MarketingSection>
	);
}
