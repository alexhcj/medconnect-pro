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
	roles: MARKETING_HOME_ROLES.items,
} as const;

export const MARKETING_ABOUT_ARCHITECTURE = {
	heading: 'Architecture',
	headingId: 'architecture',
	note: 'This is a modular monolith in an npm workspace. Do not treat domains as independently deployed microservices.',
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
	items: [
		{
			title: 'Application demo',
			description:
				'Mock identity with labeled mock MFA, patients, appointments, clinical lists, telehealth, invoices, analytics, notifications, and administration, with demo rate limiting and concurrent-session review.',
			detail: 'Live Nest mode with HttpOnly cookie sessions runs alongside the mock-first frontend.',
			status: 'Shipped',
		},
		{
			title: 'Security patterns',
			description:
				'RBAC, tenant isolation, resource-level authorization, audit events, and a tenant-scoped security-events viewer.',
			detail: 'Demo OIDC with PKCE uses a Google or Fake adapter. It is not a production IdP.',
			status: 'Shipped',
		},
		{
			title: 'Delivery pipeline',
			description:
				'GitHub Actions quality gates and manual PR previews run for this site and the web app. An interim synthetic demo is hosted on Render.',
			detail: 'AWS infrastructure code exists, but it has not been applied as a hosted production.',
			status: 'Partial',
		},
		{
			title: 'Production hosting on AWS',
			description: 'Hosted AWS production is paused until an AWS account is available.',
			detail: 'Do not claim a hosted production.',
			status: 'Paused',
		},
	],
} as const;

export const MARKETING_ABOUT_STACK = {
	heading: 'Current stack vs planned',
	headingId: 'current-stack-vs-planned',
	current: {
		title: 'Current',
		body: 'Next.js, React, TypeScript, Tailwind, NestJS 12, PostgreSQL, REST/OpenAPI, mock IdP sessions, GitHub Actions, and Terraform definitions. Daily call-object media is in the demo when configured.',
	},
	planned: {
		title: 'Planned — not shipped',
		body: 'Redis, S3/KMS document storage, and an applied AWS production environment remain planned. Do not present them as current.',
	},
} as const;

export const MARKETING_ABOUT_CTA = {
	heading: 'Explore the demo',
	headingId: 'about-demo-cta',
	body: 'Enter with mock identity at /login. Synthetic data only. No hosted production and no HIPAA certification claim.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'View platform', href: '/platform'},
} as const;
