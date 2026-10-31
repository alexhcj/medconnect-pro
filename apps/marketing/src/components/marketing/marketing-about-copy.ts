import {MARKETING_HOME_ROLES} from '@/components/marketing/marketing-home-copy';
export const MARKETING_ABOUT_HERO = {
	eyebrow: 'About',
	heading: 'A portfolio demonstration of a multi-tenant healthcare SaaS',
	headingId: 'about-heading',
	body: 'MedConnect Pro shows production-oriented architecture for interviews and potential-client conversations. It is not a deployed clinical service and is not HIPAA certified.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'View platform', href: '/platform'},
} as const;

export const MARKETING_ABOUT_PURPOSE = {
	heading: 'Purpose and audience',
	headingId: 'purpose-and-audience',
	body: 'MedConnect Pro is a portfolio and interview demonstration of how a senior engineering team could design a multi-tenant healthcare SaaS product. It is production-oriented in architecture, not a deployed clinical service. All patient information is synthetic.',
	roles: MARKETING_HOME_ROLES.items.map((role) => role.label),
} as const;

export const MARKETING_ABOUT_ARCHITECTURE = {
	heading: 'Architecture',
	headingId: 'architecture',
	note: 'This is a modular monolith in an npm workspace. Do not treat domains as independently deployed microservices.',
	link: {
		title: 'View architecture',
		description: 'System map, request and authorization flow, and current vs planned.',
		href: '/architecture',
	},
	items: [
		{
			title: 'Next.js frontend',
			description:
				'apps/marketing is this static public site. apps/web is the authenticated Next.js application and does not serve these pages.',
			detail: 'React, TypeScript, Tailwind, and shared UI primitives.',
			status: 'Current',
		},
		{
			title: 'NestJS API',
			description:
				'apps/api is a modular NestJS 12 application with REST and generated OpenAPI.',
			detail: 'Domain logic stays in the API, not in the Next.js app.',
			status: 'Current',
		},
		{
			title: 'PostgreSQL',
			description:
				'Local Compose plus TypeORM. Tenant isolation uses practice scoping and row-level security.',
			detail: 'Synthetic seed data only. Never introduce real PHI.',
			status: 'Current',
		},
	],
} as const;

export const MARKETING_ABOUT_STATE = {
	heading: 'Implementation state',
	headingId: 'implementation-state',
	columns: [
		{
			label: 'Shipped',
			items: [
				{
					title: 'Application demo',
					description:
						'Mock identity with labeled mock MFA, patients, scheduling, clinical lists, telehealth, billing and admin.',
				},
				{
					title: 'Security patterns',
					description:
						'RBAC, tenant isolation with PostgreSQL RLS, resource-level authorization and audit events.',
				},
				{
					title: 'PR previews and delivery lanes',
					description:
						'GitHub Actions quality gates and manual PR previews for this site and the web app.',
				},
				{
					title: 'Interim demo hosting',
					description: 'A synthetic demo is hosted on Render.',
				},
				{
					title: 'Design refresh',
					description:
						'A refreshed homepage, status badges, an architecture page, and consistent forms, dates and select lists in the web app.',
				},
			],
		},
		{
			label: 'In progress',
			items: [
				{
					title: '1.0.0 demo release',
					description: 'The first tagged demo release on Render, after a full pre-release check.',
				},
			],
		},
		{
			label: 'Up next',
			items: [
				{
					title: 'Accessibility follow-ups',
					description: 'Higher-contrast input borders and wider browser and screen-reader checks, after 1.0.0.',
				},
			],
		},
	],
	paused: {
		label: 'Paused',
		text: 'Production hosting on AWS is paused until an AWS account is available. No hosted production is claimed.',
	},
} as const;

export const MARKETING_ABOUT_CTA = {
	heading: 'Explore the demo',
	headingId: 'about-demo-cta',
	body: 'Enter with mock identity at /login. Synthetic data only. No hosted production and no HIPAA certification claim.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'View platform', href: '/platform'},
} as const;
