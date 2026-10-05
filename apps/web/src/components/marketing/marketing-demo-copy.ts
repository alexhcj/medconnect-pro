import {LOGIN_PATH} from '@/lib/auth/paths';
import {MARKETING_LOGIN_PREVIEW_IMAGE} from '@/components/marketing/marketing-product-visuals';

export const MARKETING_DEMO_HERO = {
	eyebrow: 'Demo',
	heading: 'Explore the demo with mock identity',
	headingId: 'demo-heading',
	body: 'Sign in through the existing mock identity provider. Demo credentials are shown on the sign-in page. This is not production identity infrastructure.',
	primaryCta: {label: 'Sign in to the demo', href: LOGIN_PATH},
	secondaryCta: {label: 'View platform', href: '/platform'},
} as const;

export const MARKETING_DEMO_HOW_TO_ENTER = {
	heading: 'How to enter',
	headingId: 'how-to-enter',
	body: 'Sign in through the existing mock identity provider at /login. Demo credentials are shown on the sign-in page. This is not production identity infrastructure. After you sign in, the dashboard uses synthetic records only.',
} as const;

export const MARKETING_DEMO_WALKTHROUGH = {
	heading: 'What you can walk through',
	headingId: 'demo-walkthrough',
	items: [
		{
			title: 'Patient management',
			description:
				'Directory, profiles, vitals, documents, and clinical lists. Link: /platform/patient-management',
			detail: 'Implemented in the authenticated app.',
			status: {label: '/platform/patient-management', href: '/platform/patient-management'},
		},
		{
			title: 'Appointments',
			description:
				'Calendar, appointments, and provider availability. Link: /platform/appointments',
			detail: 'Implemented in the authenticated app.',
			status: {label: '/platform/appointments', href: '/platform/appointments'},
		},
		{
			title: 'Telehealth session shell',
			description: 'Create, join, and end appointment-linked sessions. Not live video.',
			detail: 'Waiting-room placeholders only.',
			status: {label: '/platform/telehealth', href: '/platform/telehealth'},
		},
		{
			title: 'Billing invoices',
			description:
				'Invoice list and detail. Payments and claims are labeled boundaries, not hosted payments.',
			detail: 'Invoices are real demo data.',
			status: {label: '/platform/billing', href: '/platform/billing'},
		},
		{
			title: 'Analytics',
			description:
				'Live dashboard overview cards from Nest. Synthetic demo aggregates, not a warehouse.',
			detail: 'Qualified demo status on the public site.',
			status: {label: '/platform/analytics', href: '/platform/analytics'},
		},
		{
			title: 'Administration',
			description:
				'User directory and audit viewer. Role assignment UI is not shipped.',
			detail: 'Implemented with those limits.',
			status: {label: '/platform/administration', href: '/platform/administration'},
		},
	],
} as const;

export const MARKETING_DEMO_SAFETY = {
	heading: 'Safe exploration',
	headingId: 'safe-exploration',
	body: 'No HIPAA certification claim. No hosted production. Telehealth is a session shell, not live video. Invoices are demo data; payments and claims are labeled boundaries.',
} as const;

export const MARKETING_DEMO_LOGIN_PREVIEW = {
	heading: 'Sign-in chrome',
	headingId: 'sign-in-chrome',
	caption:
		'Captured mock identity sign-in. This is not a second sign-in form. Continue to existing /login.',
	image: MARKETING_LOGIN_PREVIEW_IMAGE,
} as const;

export const MARKETING_DEMO_CTA = {
	heading: 'Continue to /login',
	headingId: 'demo-login-cta',
	body: 'The dashboard uses synthetic records. No new identity stack. No HIPAA certification claim.',
	primaryCta: {label: 'Sign in to the demo', href: LOGIN_PATH},
	secondaryCta: {label: 'View security', href: '/security'},
} as const;
