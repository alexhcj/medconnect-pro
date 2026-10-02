export const MARKETING_PRODUCT_VISUAL_CAPTION =
	'Synthetic demo screens. Not a production medical record and not a HIPAA-certified system.';

export const MARKETING_OG_IMAGE = {
	src: '/marketing/og.png',
	width: 1200,
	height: 630,
	alt: 'Dashboard overview with synthetic demo metrics',
} as const;

export const MARKETING_LOGIN_PREVIEW_IMAGE = {
	src: '/marketing/login.png',
	alt: 'Mock identity sign-in form with synthetic demo credentials',
} as const;

export const MARKETING_PRODUCT_SLIDES = [
	{
		id: 'patients',
		src: '/marketing/patients.png',
		alt: 'Patients directory with synthetic demo records',
		label: 'Patients',
	},
	{
		id: 'appointments',
		src: '/marketing/appointments.png',
		alt: 'Appointments calendar with synthetic demo visits',
		label: 'Appointments',
	},
	{
		id: 'telehealth',
		src: '/marketing/telehealth.png',
		alt: 'Telehealth lobby with a synthetic demo visit',
		label: 'Telehealth',
	},
	{
		id: 'billing',
		src: '/marketing/billing.png',
		alt: 'Billing invoice list with synthetic demo invoices',
		label: 'Billing',
	},
	{
		id: 'analytics',
		src: '/marketing/dashboard.png',
		alt: 'Dashboard overview with synthetic demo metrics',
		label: 'Analytics',
	},
	{
		id: 'administration',
		src: '/marketing/admin.png',
		alt: 'Administration user list with synthetic demo accounts',
		label: 'Administration',
	},
] as const;

export const MARKETING_PRODUCT_SLIDE_BY_FEATURE = {
	'patient-management': MARKETING_PRODUCT_SLIDES[0],
	appointments: MARKETING_PRODUCT_SLIDES[1],
	telehealth: MARKETING_PRODUCT_SLIDES[2],
	billing: MARKETING_PRODUCT_SLIDES[3],
	analytics: MARKETING_PRODUCT_SLIDES[4],
	administration: MARKETING_PRODUCT_SLIDES[5],
} as const;
