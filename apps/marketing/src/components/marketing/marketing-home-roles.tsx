import {
	Briefcase,
	CalendarCheck,
	HeartPulse,
	type LucideIcon,
	Shield,
	Stethoscope,
	User,
} from 'lucide-react';
import {MARKETING_HOME_ROLES} from '@/components/marketing/marketing-home-copy';

type RoleLabel = (typeof MARKETING_HOME_ROLES.items)[number]['label'];

const ROLE_ICONS: Record<RoleLabel, LucideIcon> = {
	'Practice admin': Briefcase,
	Provider: Stethoscope,
	Nurse: HeartPulse,
	Receptionist: CalendarCheck,
	Patient: User,
	'Super admin': Shield,
};

/** Homepage role cards. Other pages keep `RoleTagList` pills. */
export function MarketingHomeRoles() {
	return (
		<section aria-labelledby={MARKETING_HOME_ROLES.headingId}>
			<h2
				id={MARKETING_HOME_ROLES.headingId}
				className="text-2xl font-semibold tracking-tight text-foreground"
			>
				{MARKETING_HOME_ROLES.heading}
			</h2>
			<p className="mt-4 text-base leading-relaxed text-foreground-secondary">
				{MARKETING_HOME_ROLES.intro}
			</p>
			<ul className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
				{MARKETING_HOME_ROLES.items.map((role) => {
					const Icon = ROLE_ICONS[role.label];
					return (
						<li
							key={role.label}
							className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2.5 md:flex-col md:items-start md:gap-2.5 md:p-5"
						>
							<span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand md:size-10">
								<Icon aria-hidden className="size-4 md:size-5" />
							</span>
							<span className="min-w-0">
								<h3 className="text-sm font-medium leading-snug text-foreground md:text-base md:font-semibold">
									{role.label}
								</h3>
								<p className="mt-1 hidden text-sm leading-relaxed text-foreground-secondary md:block">
									{role.scope}
								</p>
							</span>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
