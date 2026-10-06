export const MARKETING_HOME_HERO = {
	eyebrow: 'Healthcare practice platform · synthetic demo',
	heading: 'Connected care workflows for the modern practice',
	body: 'MedConnect Pro demonstrates patient records, scheduling, a telehealth session shell, invoices, and role-aware administration — with mock identity and synthetic data only.',
	primaryCta: {label: 'Explore the platform', href: '/platform'},
	secondaryCta: {label: 'Enter the demo', href: '/demo'},
} as const;

export const MARKETING_HOME_MODULES = {
	heading: 'Practice modules',
	headingId: 'practice-modules',
	items: [
		{
			title: 'Patient management',
			description: 'Directory, profiles, vitals, documents, and search.',
		},
		{
			title: 'Scheduling',
			description: 'Calendar, appointments, and provider availability.',
		},
		{
			title: 'Telehealth',
			description: 'Appointment-linked session shell. Not live video.',
		},
		{
			title: 'Billing',
			description:
				'Invoice list and detail. Payments and claims are labeled boundaries.',
		},
		{
			title: 'Analytics',
			description: 'Live dashboard overview cards. Synthetic demo aggregates, not a warehouse.',
		},
		{
			title: 'Administration',
			description:
				'User directory, audit viewer, and role assignment with tenant/grant limits.',
		},
	],
} as const;

export const MARKETING_HOME_WORKFLOW = {
	heading: 'Connected workflow',
	headingId: 'connected-workflow',
	steps: [
		{
			title: 'Sign in with mock identity',
			description: 'Use the existing /login mock IdP. Not production OAuth.',
		},
		{
			title: 'Work a patient chart',
			description: 'Profiles, vitals, documents, and clinical lists as a foundation.',
		},
		{
			title: 'Schedule and join a session shell',
			description: 'Appointments plus telehealth create/join/end. No live video.',
		},
		{
			title: 'Review invoices and audit',
			description:
				'Billing invoices are real demo data; payments stay labeled boundaries.',
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

export const MARKETING_HOME_SECURITY_PRINCIPLES = {
	heading: 'Security principles',
	headingId: 'security-principles',
	items: [
		{
			title: 'Mock identity',
			description: 'Demo sessions via the existing mock IdP. Not production OAuth or OIDC.',
		},
		{
			title: 'RBAC and tenant isolation',
			description: 'Role and resource checks as implemented engineering patterns.',
		},
		{
			title: 'Audit events',
			description: 'Administration includes an audit viewer. Synthetic data only.',
		},
	],
} as const;

export const MARKETING_HOME_ROLES = {
	heading: 'Who it is for',
	headingId: 'intended-roles',
	items: [
		'Practice admin',
		'Provider',
		'Nurse',
		'Receptionist',
		'Patient',
		'Super admin',
	],
} as const;

export const MARKETING_HOME_CTA = {
	heading: 'Explore the demo',
	headingId: 'demo-cta',
	body: 'Enter with mock identity at /login. Synthetic data only. No hosted production and no HIPAA certification claim.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'View platform', href: '/platform'},
} as const;
