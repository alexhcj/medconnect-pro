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
				'apps/web is a Next.js App Router application. Public marketing routes do not inherit the dashboard shell.',
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
			title: 'M0–M7 shipped',
			description:
				'Authentication, patients, appointments, clinical lists, telehealth session shell, invoices, and administration.',
			detail: 'Live Nest mode exists alongside the mock-first frontend.',
			status: 'Shipped',
		},
		{
			title: 'M8 marketing',
			description:
				'This public site describes implemented capabilities without inventing unshipped product features.',
			detail: 'Polish and captured product visuals are a later M8 task.',
			status: 'In progress',
		},
		{
			title: 'Later: deploy',
			description:
				'GitHub Actions, preview environments, and production hosting are a later milestone.',
			detail: 'Do not claim a hosted production.',
			status: 'Not this milestone',
		},
	],
} as const;

export const MARKETING_ABOUT_STACK = {
	heading: 'Current stack vs planned',
	headingId: 'current-stack-vs-planned',
	current: {
		title: 'Current',
		body: 'Next.js, React, TypeScript, Tailwind, NestJS 12, PostgreSQL, REST/OpenAPI, mock IdP sessions.',
	},
	planned: {
		title: 'Planned — not shipped',
		body: 'Redis, S3/KMS, Daily/WebRTC, AWS, Docker, Terraform, and GitHub Actions are planned. Do not present them as current.',
	},
} as const;

export const MARKETING_ABOUT_CTA = {
	heading: 'Explore the demo',
	headingId: 'about-demo-cta',
	body: 'Enter with mock identity at /login. Synthetic data only. No hosted production and no HIPAA certification claim.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'View platform', href: '/platform'},
} as const;
