import type {FeaturePageLayoutProps} from '@/components/marketing/feature-page-layout';
import {
	MARKETING_PRODUCT_SLIDE_BY_FEATURE,
	MARKETING_PRODUCT_VISUAL_CAPTION,
} from '@/components/marketing/marketing-product-visuals';

export const FEATURE_PAGE_SLUGS = [
	'patient-management',
	'appointments',
	'telehealth',
	'billing',
	'analytics',
	'administration',
] as const;

export type FeaturePageSlug = (typeof FEATURE_PAGE_SLUGS)[number];

const FEATURE_PAGE_HERO_CTAS = {
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'View platform', href: '/platform'},
} as const;

const FEATURE_PAGE_WALKTHROUGH_CAPTION = MARKETING_PRODUCT_VISUAL_CAPTION;

const FEATURE_PAGE_CTA_BAND = {
	heading: 'Explore the demo',
	body: 'Enter with mock identity at /login. Synthetic data only. No hosted production and no HIPAA certification claim.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'View platform', href: '/platform'},
} as const;

export const FEATURE_PAGE_METADATA: Record<
	FeaturePageSlug,
	{title: string; description: string}
> = {
	'patient-management': {
		title: 'Patient management',
		description:
			'Patient directory, profiles, vitals, documents, and history in the MedConnect Pro demo. Synthetic data only.',
	},
	appointments: {
		title: 'Appointments',
		description:
			'Calendar, appointments, and provider availability in the MedConnect Pro demo. Synthetic data only.',
	},
	telehealth: {
		title: 'Telehealth',
		description:
			'Appointment-linked telehealth session shell: create, join, and end. Not live video, Daily, or WebRTC.',
	},
	billing: {
		title: 'Billing',
		description:
			'Invoice list and detail with synthetic demo data. Payments and claims are labeled boundaries, not hosted payments.',
	},
	analytics: {
		title: 'Analytics',
		description:
			'Live dashboard overview cards from Nest GET /dashboard/overview. Synthetic demo aggregates, not a warehouse.',
	},
	administration: {
		title: 'Administration',
		description:
			'User directory and audit viewer in the MedConnect Pro demo. Role assignment UI is not shipped.',
	},
};

export const FEATURE_PAGES: Record<FeaturePageSlug, FeaturePageLayoutProps> = {
	'patient-management': {
		hero: {
			headingId: 'patient-management-hero-heading',
			eyebrow: 'Patient management · synthetic demo',
			heading: 'Patient records for the practice',
			body: 'Directory, profiles, vitals, documents, and history in the demo. Synthetic data only.',
			...FEATURE_PAGE_HERO_CTAS,
		},
		capabilities: {
			heading: 'Key capabilities',
			headingId: 'patient-management-capabilities',
			items: [
				{
					title: 'Directory and search',
					description: 'Search and open patient records in the practice directory.',
				},
				{
					title: 'Profiles',
					description: 'View demographics and chart details for a selected patient.',
				},
				{
					title: 'Vitals, documents, and clinical lists',
					description:
						'Vitals, documents, and clinical lists as a foundation. Synthetic data only.',
				},
			],
		},
		walkthrough: {
			heading: 'Product walkthrough',
			headingId: 'patient-management-walkthrough',
			caption: FEATURE_PAGE_WALKTHROUGH_CAPTION,
			image: {
				src: MARKETING_PRODUCT_SLIDE_BY_FEATURE['patient-management'].src,
				alt: MARKETING_PRODUCT_SLIDE_BY_FEATURE['patient-management'].alt,
			},
		},
		workflow: {
			heading: 'How this module fits the platform',
			headingId: 'patient-management-workflow',
			steps: [
				{
					title: 'Sign in with mock identity',
					description: 'Use the existing /login mock IdP. Not production OAuth.',
				},
				{
					title: 'Search the directory',
					description: 'Find a patient in the practice directory.',
				},
				{
					title: 'Open a profile',
					description: 'Vitals, documents, and clinical lists as a foundation.',
				},
				{
					title: 'Continue to scheduling or invoices',
					description: 'Related modules stay one click away.',
				},
			],
		},
		related: {
			heading: 'Related modules',
			headingId: 'patient-management-related',
			links: [
				{label: 'Appointments', href: '/platform/appointments'},
				{label: 'Telehealth', href: '/platform/telehealth'},
				{label: 'Billing', href: '/platform/billing'},
			],
		},
		cta: {
			headingId: 'patient-management-demo-cta',
			...FEATURE_PAGE_CTA_BAND,
		},
	},
	appointments: {
		hero: {
			headingId: 'appointments-hero-heading',
			eyebrow: 'Appointments · synthetic demo',
			heading: 'Calendar, appointments, and availability',
			body: 'Schedule visits against provider availability in the demo.',
			...FEATURE_PAGE_HERO_CTAS,
		},
		capabilities: {
			heading: 'Key capabilities',
			headingId: 'appointments-capabilities',
			items: [
				{
					title: 'Calendar views',
					description: 'Browse the practice calendar in the demo.',
				},
				{
					title: 'Appointments',
					description: 'Create and review appointments with synthetic data.',
				},
				{
					title: 'Provider availability',
					description: 'Book against provider availability as implemented.',
				},
			],
		},
		walkthrough: {
			heading: 'Product walkthrough',
			headingId: 'appointments-walkthrough',
			caption: FEATURE_PAGE_WALKTHROUGH_CAPTION,
			image: {
				src: MARKETING_PRODUCT_SLIDE_BY_FEATURE.appointments.src,
				alt: MARKETING_PRODUCT_SLIDE_BY_FEATURE.appointments.alt,
			},
		},
		workflow: {
			heading: 'How this module fits the platform',
			headingId: 'appointments-workflow',
			steps: [
				{
					title: 'Sign in with mock identity',
					description: 'Use the existing /login mock IdP. Not production OAuth.',
				},
				{
					title: 'Open the calendar',
					description: 'Use the appointments calendar in the demo.',
				},
				{
					title: 'Book against availability',
					description: 'Schedule visits against provider availability.',
				},
				{
					title: 'Link a virtual visit',
					description:
						'Connect the appointment to the telehealth session shell. No live video.',
				},
			],
		},
		related: {
			heading: 'Related modules',
			headingId: 'appointments-related',
			links: [
				{label: 'Patient management', href: '/platform/patient-management'},
				{label: 'Telehealth', href: '/platform/telehealth'},
				{label: 'Billing', href: '/platform/billing'},
			],
		},
		cta: {
			headingId: 'appointments-demo-cta',
			...FEATURE_PAGE_CTA_BAND,
		},
	},
	telehealth: {
		hero: {
			headingId: 'telehealth-hero-heading',
			eyebrow: 'Telehealth · session shell',
			heading: 'Appointment-linked virtual-visit workflow',
			body: 'Create, join, and end a session shell with waiting-room placeholders. Not live video.',
			...FEATURE_PAGE_HERO_CTAS,
		},
		capabilities: {
			heading: 'Key capabilities',
			headingId: 'telehealth-capabilities',
			items: [
				{
					title: 'Appointment-linked sessions',
					description: 'Start from an existing appointment in the demo.',
				},
				{
					title: 'Create, join, and end',
					description:
						'Session-shell controls as implemented. Waiting-room placeholders included.',
				},
				{
					title: 'Honest status',
					description: 'Not live video. Not Daily or WebRTC.',
				},
			],
		},
		walkthrough: {
			heading: 'Product walkthrough',
			headingId: 'telehealth-walkthrough',
			caption: FEATURE_PAGE_WALKTHROUGH_CAPTION,
			image: {
				src: MARKETING_PRODUCT_SLIDE_BY_FEATURE.telehealth.src,
				alt: MARKETING_PRODUCT_SLIDE_BY_FEATURE.telehealth.alt,
			},
		},
		workflow: {
			heading: 'How this module fits the platform',
			headingId: 'telehealth-workflow',
			steps: [
				{
					title: 'Sign in with mock identity',
					description: 'Use the existing /login mock IdP. Not production OAuth.',
				},
				{
					title: 'Start from an appointment',
					description: 'Virtual visits stay linked to an appointment in the demo.',
				},
				{
					title: 'Create or join the session shell',
					description:
						'Waiting-room placeholders are part of the shell. No live video.',
				},
				{
					title: 'End the session',
					description: 'Create, join, and end only. Not Daily or WebRTC.',
				},
			],
		},
		related: {
			heading: 'Related modules',
			headingId: 'telehealth-related',
			links: [
				{label: 'Appointments', href: '/platform/appointments'},
				{label: 'Patient management', href: '/platform/patient-management'},
				{label: 'Platform', href: '/platform'},
			],
		},
		cta: {
			headingId: 'telehealth-demo-cta',
			...FEATURE_PAGE_CTA_BAND,
		},
	},
	billing: {
		hero: {
			headingId: 'billing-hero-heading',
			eyebrow: 'Billing · invoices in the demo',
			heading: 'Invoice list and detail',
			body: 'Invoices are real demo data. Payments and claims stay labeled boundaries. Not hosted payments.',
			...FEATURE_PAGE_HERO_CTAS,
		},
		capabilities: {
			heading: 'Key capabilities',
			headingId: 'billing-capabilities',
			items: [
				{
					title: 'Invoice list and detail',
					description: 'Invoice list and detail with synthetic demo data.',
				},
				{
					title: 'Payments boundary',
					description: 'Payments stay a labeled boundary. Not hosted payments.',
				},
				{
					title: 'Claims boundary',
					description: 'Claims stay a labeled boundary. Not shipped.',
				},
			],
		},
		walkthrough: {
			heading: 'Product walkthrough',
			headingId: 'billing-walkthrough',
			caption: FEATURE_PAGE_WALKTHROUGH_CAPTION,
			image: {
				src: MARKETING_PRODUCT_SLIDE_BY_FEATURE.billing.src,
				alt: MARKETING_PRODUCT_SLIDE_BY_FEATURE.billing.alt,
			},
		},
		workflow: {
			heading: 'How this module fits the platform',
			headingId: 'billing-workflow',
			steps: [
				{
					title: 'Sign in with mock identity',
					description: 'Use the existing /login mock IdP. Not production OAuth.',
				},
				{
					title: 'Open invoices',
					description: 'Use the invoice list in the demo.',
				},
				{
					title: 'Review invoice detail',
					description: 'Invoices are real demo data. Synthetic records only.',
				},
				{
					title: 'Payments and claims remain labeled',
					description: 'Do not claim hosted payments or claims submission.',
				},
			],
		},
		related: {
			heading: 'Related modules',
			headingId: 'billing-related',
			links: [
				{label: 'Patient management', href: '/platform/patient-management'},
				{label: 'Appointments', href: '/platform/appointments'},
				{label: 'Platform', href: '/platform'},
			],
		},
		cta: {
			headingId: 'billing-demo-cta',
			...FEATURE_PAGE_CTA_BAND,
		},
	},
	analytics: {
		hero: {
			headingId: 'analytics-hero-heading',
			eyebrow: 'Analytics · demo cards',
			heading: 'Dashboard overview as it exists',
			body: 'Live dashboard overview cards from Nest GET /dashboard/overview. Synthetic demo aggregates only. Not a warehouse.',
			...FEATURE_PAGE_HERO_CTAS,
		},
		capabilities: {
			heading: 'Key capabilities',
			headingId: 'analytics-capabilities',
			items: [
				{
					title: 'Overview cards',
					description: 'Dashboard metrics from Nest in live mode; fixtures when mocks are on.',
				},
				{
					title: 'Honest status',
					description: 'Synthetic demo aggregates. Not a warehouse or HIPAA analytics.',
				},
				{
					title: 'Limits',
					description: 'Extra chart widgets remain unscheduled.',
				},
			],
		},
		walkthrough: {
			heading: 'Product walkthrough',
			headingId: 'analytics-walkthrough',
			caption: FEATURE_PAGE_WALKTHROUGH_CAPTION,
			image: {
				src: MARKETING_PRODUCT_SLIDE_BY_FEATURE.analytics.src,
				alt: MARKETING_PRODUCT_SLIDE_BY_FEATURE.analytics.alt,
			},
		},
		workflow: {
			heading: 'How this module fits the platform',
			headingId: 'analytics-workflow',
			steps: [
				{
					title: 'Sign in with mock identity',
					description: 'Use the existing /login mock IdP. Not production OAuth.',
				},
				{
					title: 'Open the dashboard',
					description: 'The overview lives on the authenticated dashboard.',
				},
				{
					title: 'Read overview cards',
					description: 'Cards show session-tenant aggregates. Synthetic data only.',
				},
				{
					title: 'Treat extra charts as unscheduled',
					description: 'No warehouse or HIPAA analytics in this demo.',
				},
			],
		},
		related: {
			heading: 'Related modules',
			headingId: 'analytics-related',
			links: [
				{label: 'Platform', href: '/platform'},
				{label: 'Appointments', href: '/platform/appointments'},
				{label: 'Billing', href: '/platform/billing'},
			],
		},
		cta: {
			headingId: 'analytics-demo-cta',
			...FEATURE_PAGE_CTA_BAND,
		},
	},
	administration: {
		hero: {
			headingId: 'administration-hero-heading',
			eyebrow: 'Administration · demo limits',
			heading: 'Users and audit viewer',
			body: 'User directory and audit viewer. Role assignment UI is not shipped.',
			...FEATURE_PAGE_HERO_CTAS,
		},
		capabilities: {
			heading: 'Key capabilities',
			headingId: 'administration-capabilities',
			items: [
				{
					title: 'User directory',
					description: 'Browse practice users in the demo.',
				},
				{
					title: 'Audit viewer',
					description: 'Review audit events with synthetic data.',
				},
				{
					title: 'Honest status',
					description: 'Role assignment UI is not shipped.',
				},
			],
		},
		walkthrough: {
			heading: 'Product walkthrough',
			headingId: 'administration-walkthrough',
			caption: FEATURE_PAGE_WALKTHROUGH_CAPTION,
			image: {
				src: MARKETING_PRODUCT_SLIDE_BY_FEATURE.administration.src,
				alt: MARKETING_PRODUCT_SLIDE_BY_FEATURE.administration.alt,
			},
		},
		workflow: {
			heading: 'How this module fits the platform',
			headingId: 'administration-workflow',
			steps: [
				{
					title: 'Sign in as practice admin or super admin',
					description: 'Use the existing /login mock IdP. Not production OAuth.',
				},
				{
					title: 'Browse users',
					description: 'Open the user directory in administration.',
				},
				{
					title: 'Open the audit viewer',
					description: 'Audit events use synthetic data only.',
				},
				{
					title: 'Role assignment UI is not part of this demo',
					description: 'Role assignment is not a current demo surface.',
				},
			],
		},
		related: {
			heading: 'Related modules',
			headingId: 'administration-related',
			links: [
				{label: 'Platform', href: '/platform'},
				{label: 'Patient management', href: '/platform/patient-management'},
				{label: 'Analytics', href: '/platform/analytics'},
			],
		},
		cta: {
			headingId: 'administration-demo-cta',
			...FEATURE_PAGE_CTA_BAND,
		},
	},
};
