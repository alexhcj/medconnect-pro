import {MARKETING_HOME_ROLES} from '@/components/marketing/marketing-home-copy';
import {MarketingSection} from '@/components/marketing/marketing-section';
import {RoleTagList} from '@/components/ui/role-tag';

export function MarketingHomeRoles() {
	return (
		<MarketingSection
			headingId={MARKETING_HOME_ROLES.headingId}
			title={MARKETING_HOME_ROLES.heading}
		>
			<RoleTagList roles={MARKETING_HOME_ROLES.items} />
		</MarketingSection>
	);
}
