import {
	Calendar,
	CreditCard,
	LayoutDashboard,
	type LucideIcon,
	Shield,
	Users,
	Video,
} from 'lucide-react';
import {MARKETING_HOME_MODULES} from '@/components/marketing/marketing-home-copy';
import {MarketingLinkCard} from '@/components/marketing/marketing-link-card';
import {MarketingSection} from '@/components/marketing/marketing-section';

type ModuleHref = (typeof MARKETING_HOME_MODULES.items)[number]['href'];

/** Same icons as the app sidebar (`apps/web/src/lib/navigation/dashboard-nav.ts`). */
const MODULE_ICONS: Record<ModuleHref, LucideIcon> = {
	'/platform/patient-management': Users,
	'/platform/appointments': Calendar,
	'/platform/telehealth': Video,
	'/platform/billing': CreditCard,
	'/platform/analytics': LayoutDashboard,
	'/platform/administration': Shield,
};

export function MarketingHomeModules() {
	return (
		<MarketingSection
			headingId={MARKETING_HOME_MODULES.headingId}
			title={MARKETING_HOME_MODULES.heading}
		>
			<ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{MARKETING_HOME_MODULES.items.map((item) => (
					<li key={item.href} className="flex">
						<MarketingLinkCard
							href={item.href}
							title={item.title}
							description={item.description}
							icon={MODULE_ICONS[item.href]}
							className="w-full p-4 md:p-6"
						/>
					</li>
				))}
			</ul>
		</MarketingSection>
	);
}
