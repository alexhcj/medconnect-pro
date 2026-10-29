import {Database, FileLock, KeyRound, type LucideIcon, ScrollText, ShieldCheck} from 'lucide-react';
import {MARKETING_HOME_SECURITY_PRINCIPLES} from '@/components/marketing/marketing-home-copy';
import {MarketingSplitSection} from '@/components/marketing/marketing-split-section';

type SecurityTitle = (typeof MARKETING_HOME_SECURITY_PRINCIPLES.items)[number]['title'];

const SECURITY_ICONS: Record<SecurityTitle, LucideIcon> = {
	'Mock identity': KeyRound,
	'RBAC and tenant isolation': ShieldCheck,
	'Audit events': ScrollText,
	'PostgreSQL RLS': Database,
	'Document ACL': FileLock,
};

export function MarketingHomeSecurity() {
	return (
		<MarketingSplitSection
			headingId={MARKETING_HOME_SECURITY_PRINCIPLES.headingId}
			title={MARKETING_HOME_SECURITY_PRINCIPLES.heading}
			intro={MARKETING_HOME_SECURITY_PRINCIPLES.intro}
			link={MARKETING_HOME_SECURITY_PRINCIPLES.link}
		>
			<ul className="grid gap-2 md:gap-3">
				{MARKETING_HOME_SECURITY_PRINCIPLES.items.map((item) => {
					const Icon = SECURITY_ICONS[item.title];
					return (
						<li
							key={item.title}
							className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 md:gap-4 md:px-6 md:py-5"
						>
							<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand md:size-10">
								<Icon aria-hidden className="size-4 md:size-5" />
							</span>
							<span className="min-w-0">
								<h3 className="text-base font-semibold leading-snug text-foreground">
									{item.title}
								</h3>
								<p className="mt-1 text-sm leading-relaxed text-foreground-secondary">
									{item.description}
								</p>
							</span>
						</li>
					);
				})}
			</ul>
		</MarketingSplitSection>
	);
}
