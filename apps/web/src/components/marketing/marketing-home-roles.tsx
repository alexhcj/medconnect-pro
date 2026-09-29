import {MARKETING_HOME_ROLES} from '@/components/marketing/marketing-home-copy';
import {MarketingSection} from '@/components/marketing/marketing-section';

export function MarketingHomeRoles() {
	return (
		<MarketingSection
			headingId={MARKETING_HOME_ROLES.headingId}
			title={MARKETING_HOME_ROLES.heading}
		>
			<ul className="flex flex-wrap gap-3">
				{MARKETING_HOME_ROLES.items.map((role) => (
					<li
						key={role}
						className="inline-flex min-h-11 items-center rounded-full bg-brand-subtle px-4 text-sm font-medium text-brand-hover"
					>
						{role}
					</li>
				))}
			</ul>
		</MarketingSection>
	);
}
