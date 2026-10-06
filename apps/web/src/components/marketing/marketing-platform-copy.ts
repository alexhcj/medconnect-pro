import {LOGIN_PATH} from '@/lib/auth/paths';

export const MARKETING_PLATFORM_HERO = {
	eyebrow: 'Healthcare practice platform · synthetic demo',
	heading: 'Practice modules in one platform',
	headingId: 'platform-overview-heading',
	body: 'Patient records, scheduling, a telehealth session shell, invoices, mock analytics cards, and administration — with honest status for each module. Synthetic data only.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'Sign in', href: LOGIN_PATH},
} as const;

export const MARKETING_PLATFORM_MODULES = {
	heading: 'Demo modules',
	headingId: 'demo-modules',
	items: [
		{
			title: 'Patient management',
			description: 'Directory, profiles, vitals, documents, and search.',
			status: 'Implemented in the demo.',
			href: '/platform/patient-management',
		},
		{
			title: 'Appointments and scheduling',
			description: 'Calendar, appointments, and provider availability.',
			status: 'Implemented in the demo.',
			href: '/platform/appointments',
		},
		{
			title: 'Telehealth',
			description: 'Appointment-linked session shell.',
			status: 'Not live video.',
			href: '/platform/telehealth',
		},
		{
			title: 'Billing',
			description:
				'Invoice list and detail. Payments and claims are labeled boundaries.',
			status: 'Not hosted payments.',
			href: '/platform/billing',
		},
		{
			title: 'Analytics',
			description: 'Live dashboard overview cards (synthetic demo aggregates).',
			status: 'Not a warehouse or HIPAA analytics.',
			href: '/platform/analytics',
		},
		{
			title: 'Administration',
			description: 'User directory, audit viewer, and role assignment with tenant/grant limits.',
			status: 'Security-events HTTP is not shipped.',
			href: '/platform/administration',
		},
	],
} as const;

export const MARKETING_PLATFORM_CTA = {
	heading: 'Explore the demo',
	headingId: 'platform-demo-cta',
	body: 'Enter with mock identity at /login. Synthetic data only. No hosted production and no HIPAA certification claim.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'Back to home', href: '/'},
} as const;

export const PLATFORM_MODULE_HREFS = MARKETING_PLATFORM_MODULES.items.map(
	(item) => item.href,
);
