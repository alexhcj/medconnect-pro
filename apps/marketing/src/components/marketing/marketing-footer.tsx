import {MarketingFooterNav} from '@/components/marketing/marketing-footer-nav';

export function MarketingFooter() {
	return (
		<footer className="border-t border-border bg-canvas">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
				<p className="text-sm text-foreground-secondary">
					MedConnect Pro is a portfolio demonstration with synthetic data. It is not a
					certified production healthcare system.
				</p>
				<MarketingFooterNav />
			</div>
		</footer>
	);
}
