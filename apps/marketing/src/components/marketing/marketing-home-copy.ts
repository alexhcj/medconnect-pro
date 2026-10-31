import {
	MARKETING_SECURITY_CONTROLS,
	MARKETING_SECURITY_HERO,
} from '@/components/marketing/marketing-security-copy';

export const MARKETING_HOME_HERO = {
	eyebrow: 'Healthcare practice platform · synthetic demo',
	heading: 'Connected care workflows for the modern practice',
	body: 'MedConnect Pro demonstrates patient records, scheduling, a telehealth session shell, invoices, and role-aware administration — with mock identity and synthetic data only.',
	primaryCta: {label: 'Explore the platform', href: '/platform'},
	secondaryCta: {label: 'Enter the demo', href: '/demo'},
	chips: ['RBAC and tenant isolation', 'Synthetic data only'],
} as const;

export const MARKETING_HOME_MODULES = {
	heading: 'Practice modules',
	headingId: 'practice-modules',
	items: [
		{
			title: 'Patient management',
			description: 'Directory, profiles, vitals, documents, and search.',
			href: '/platform/patient-management',
		},
		{
			title: 'Scheduling',
			description: 'Calendar, appointments, and provider availability.',
			href: '/platform/appointments',
		},
		{
			title: 'Telehealth',
			description: 'Appointment-linked session shell with demo Daily media when configured.',
			href: '/platform/telehealth',
		},
		{
			title: 'Billing',
			description:
				'Invoice list and detail. Demo payments use an in-process adapter. Claims are labeled envelopes, not EDI submission.',
			href: '/platform/billing',
		},
		{
			title: 'Analytics',
			description: 'Live dashboard overview cards. Synthetic demo aggregates, not a warehouse.',
			href: '/platform/analytics',
		},
		{
			title: 'Administration',
			description:
				'User directory, audit viewer, and role assignment with tenant/grant limits.',
			href: '/platform/administration',
		},
	],
} as const;

export const MARKETING_HOME_WORKFLOW = {
	heading: 'Connected workflow',
	headingId: 'connected-workflow',
	steps: [
		{
			title: 'Sign in with mock identity',
			description:
				'Pick a synthetic demo account on /login and sign in through the mock IdP. Not production OAuth.',
		},
		{
			title: 'Work a patient chart',
			description: 'Profiles, vitals, documents, and clinical lists as a foundation.',
		},
		{
			title: 'Schedule and join a session shell',
			description: 'Appointments plus telehealth create/join/leave/end. Demo Daily media when configured.',
		},
		{
			title: 'Review invoices and audit',
			description:
				'Synthetic invoices with demo payments through an in-process adapter. Admins check the audit viewer and security events.',
		},
	],
} as const;

export const MARKETING_HOME_PREVIEW = {
	heading: 'Product UI',
	headingId: 'product-ui',
} as const;

export const MARKETING_HOME_UX_PRINCIPLES = {
	heading: 'UX principles',
	headingId: 'ux-principles',
	items: [
		{
			title: 'Restrained hierarchy',
			description: 'Professional healthcare SaaS. Clear type, visible focus, no novelty chrome.',
		},
		{
			title: 'Spacious marketing',
			description:
				'Public pages stay open. The authenticated dashboard stays information-dense.',
		},
		{
			title: 'Accessible by default',
			description:
				'WCAG 2.1 AA-oriented contrast, landmarks, keyboard, and 44px marketing targets.',
		},
	],
} as const;

type SecurityControl = (typeof MARKETING_SECURITY_CONTROLS.items)[number];

/** Reuses `/security` copy verbatim so the two pages cannot drift. */
function securityControl<T extends SecurityControl['title']>(
	title: T,
): {title: T; description: string} {
	const control = MARKETING_SECURITY_CONTROLS.items.find((item) => item.title === title);
	if (!control) {
		throw new Error(`Unknown security control: ${title}`);
	}
	return {title, description: control.description};
}

export const MARKETING_HOME_SECURITY_PRINCIPLES = {
	heading: 'Security principles',
	headingId: 'security-principles',
	intro: MARKETING_SECURITY_HERO.body,
	link: {label: 'Security', href: '/security'},
	items: [
		securityControl('Mock identity'),
		{
			title: 'RBAC and tenant isolation',
			description: 'Role and resource checks as implemented engineering patterns.',
		},
		{
			title: 'Audit events',
			description: 'Administration includes an audit viewer. Synthetic data only.',
		},
		securityControl('PostgreSQL RLS'),
		securityControl('Document ACL'),
	],
} as const;

/** Scope lines follow FE-052 "Approved new copy" (nav role groups and the identity contract). */
export const MARKETING_HOME_ROLES = {
	heading: 'Who it is for',
	headingId: 'intended-roles',
	intro: 'Each role sees only the modules and records its permissions allow. Synthetic demo accounts only.',
	items: [
		{
			label: 'Practice admin',
			scope: 'Users, role assignment, audit viewer, and billing for the practice.',
		},
		{label: 'Provider', scope: 'Patients, appointments, telehealth, and practice invoices.'},
		{label: 'Nurse', scope: 'Assigned patients, appointments, and telehealth.'},
		{label: 'Receptionist', scope: 'Patient demographics, scheduling, and invoices.'},
		{label: 'Patient', scope: 'Own appointments, telehealth visits, and invoices only.'},
		{label: 'Super admin', scope: 'Every module, scoped to the signed-in practice.'},
	],
} as const;

export const MARKETING_HOME_CTA = {
	heading: 'Explore the demo',
	headingId: 'demo-cta',
	body: 'Enter with mock identity at /login. Synthetic data only. No hosted production and no HIPAA certification claim.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'View platform', href: '/platform'},
} as const;
