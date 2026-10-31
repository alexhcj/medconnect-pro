import {MARKETING_SECURITY_AUTHORIZATION} from '@/components/marketing/marketing-security-copy';

/**
 * Sourced from docs/architecture/*. The API module list mirrors
 * docs/architecture/backend-architecture.md "Modules"; review this file when that doc changes.
 */
export const MARKETING_ARCHITECTURE_HERO = {
	eyebrow: 'Architecture',
	heading: 'How MedConnect Pro fits together',
	headingId: 'architecture-heading',
	body: 'A modular monolith in one npm workspace: a public site and a web app, one NestJS API and one PostgreSQL database. External providers and planned services are labelled, and planned items are never shown as current.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'View security', href: '/security'},
} as const;

export type ArchitectureNodeState = 'Current' | 'External' | 'Planned';

export type ArchitectureNodeId =
	| 'public-site'
	| 'web-app'
	| 'api'
	| 'database'
	| 'video-calls'
	| 'sign-in'
	| 'hosting'
	| 'cache'
	| 'document-storage'
	| 'production-cloud';

export interface ArchitectureNode {
	id: ArchitectureNodeId;
	name: string;
	technical: string;
	state: ArchitectureNodeState;
	whatItDoes: string;
	connectsTo: readonly string[];
	controls?: readonly string[];
	modules?: readonly string[];
}

export const MARKETING_ARCHITECTURE_GROUPS = [
	{state: 'Current', label: 'Running in the demo'},
	{state: 'External', label: 'External providers'},
	{state: 'Planned', label: 'Planned — not shipped'},
] as const satisfies readonly {state: ArchitectureNodeState; label: string}[];

export const MARKETING_ARCHITECTURE_NODES: readonly ArchitectureNode[] = [
	{
		id: 'public-site',
		name: 'Public site',
		technical: 'apps/marketing · static Next.js',
		state: 'Current',
		whatItDoes:
			'The pages you are reading. A static site with no sign-in and no patient data. Sign-in links go to the web app.',
		connectsTo: ['Web app'],
	},
	{
		id: 'web-app',
		name: 'Web app',
		technical: 'apps/web · Next.js',
		state: 'Current',
		whatItDoes:
			'The signed-in application for practice staff and patients. It shows screens and calls the API; it does not decide who may see what.',
		connectsTo: ['API', 'Video calls'],
		controls: ['Frontend role checks are UX only'],
	},
	{
		id: 'api',
		name: 'API',
		technical: 'NestJS 12 · modular monolith',
		state: 'Current',
		whatItDoes:
			'Handles every request from the web app. It checks who is signed in, which practice they belong to and what they may see before it reads or changes any data.',
		connectsTo: ['Web app', 'Database', 'Sign-in'],
		controls: [
			'RBAC and resource authorization',
			'Tenant isolation (service scoping)',
			'Audit events',
			'Document ACL',
		],
		modules: [
			'Identity & Access',
			'Practice / Provider',
			'Patient',
			'Scheduling',
			'EHR',
			'Telehealth',
			'Billing',
			'Notifications',
			'Audit / Compliance',
		],
	},
	{
		id: 'database',
		name: 'Database',
		technical: 'PostgreSQL · practice scoping + RLS',
		state: 'Current',
		whatItDoes:
			'Stores synthetic demo records. Row-level security keeps each practice to its own rows, and the app connects with a least-privilege role.',
		connectsTo: ['API'],
		controls: ['Tenant isolation (row-level security)', 'Least-privilege database role'],
	},
	{
		id: 'video-calls',
		name: 'Video calls',
		technical: 'Daily · call-object media',
		state: 'External',
		whatItDoes:
			'Carries demo telehealth audio and video when it is configured. Without it, the visit screen says media is unavailable.',
		connectsTo: ['Web app', 'API'],
	},
	{
		id: 'sign-in',
		name: 'Sign-in',
		technical: 'OIDC adapter · mock IdP today',
		state: 'External',
		whatItDoes:
			'Proves who you are. The demo uses a mock identity provider with a labelled mock MFA step. It is not production OAuth.',
		connectsTo: ['API'],
		controls: ['Mock identity sessions'],
	},
	{
		id: 'hosting',
		name: 'Demo hosting',
		technical: 'Render · synthetic demo',
		state: 'External',
		whatItDoes:
			'Hosts the interim synthetic demo: this site, the web app, the API and the database. It is not a production environment.',
		connectsTo: ['Public site', 'Web app', 'API', 'Database'],
	},
	{
		id: 'cache',
		name: 'Cache and queues',
		technical: 'Redis',
		state: 'Planned',
		whatItDoes:
			'Planned for caching and short-lived coordination. Not shipped: rate limits use PostgreSQL today.',
		connectsTo: ['API'],
	},
	{
		id: 'document-storage',
		name: 'Document storage',
		technical: 'S3 + KMS',
		state: 'Planned',
		whatItDoes:
			'Planned encrypted object storage for patient documents. Not shipped: the demo uses a local document store.',
		connectsTo: ['API'],
	},
	{
		id: 'production-cloud',
		name: 'Production cloud',
		technical: 'AWS · not deployed',
		state: 'Planned',
		whatItDoes:
			'Planned production hosting. Paused until an AWS account is available. No hosted production is claimed.',
		connectsTo: ['Web app', 'API', 'Database'],
	},
];

export const MARKETING_ARCHITECTURE_MAP = {
	heading: 'System map',
	headingId: 'system-map',
	intro: 'Select a part of the system to see what it does. Solid boxes run in the demo today. Dashed boxes are planned and not shipped.',
	svgTitle: 'MedConnect Pro system map',
	svgDescription:
		'The public site and web app sit above the API. The API connects to the database and to the sign-in provider. The web app connects to Daily video calls. Render hosts the demo. Redis, S3 with KMS and AWS production are planned and not shipped.',
	defaultNodeId: 'api',
	clientsLabel: 'Clients',
	note: 'Modules are not separate services. Frontend checks are UX only; the API is authoritative.',
} as const satisfies {defaultNodeId: ArchitectureNodeId} & Record<string, string>;

const ENFORCED_IN = ['API', 'API and PostgreSQL RLS', 'API', 'API', 'API and PostgreSQL RLS'];

export const MARKETING_ARCHITECTURE_FLOW = {
	heading: 'Request and authorization flow',
	headingId: 'request-flow',
	intro: `Every API request passes these five checks in order. ${MARKETING_SECURITY_AUTHORIZATION.note}`,
	steps: MARKETING_SECURITY_AUTHORIZATION.steps.map((step, index) => ({
		...step,
		enforcedIn: ENFORCED_IN[index],
	})),
} as const;

export const MARKETING_ARCHITECTURE_STACK = {
	heading: 'Current vs planned',
	headingId: 'current-vs-planned',
	current: {
		title: 'Current',
		body: 'Next.js, React, TypeScript, Tailwind, NestJS 12, PostgreSQL, REST/OpenAPI, mock IdP sessions, GitHub Actions, and Terraform definitions. Daily call-object media is in the demo when configured.',
	},
	planned: {
		title: 'Planned — not shipped',
		body: 'Redis, S3/KMS document storage, and an applied AWS production environment remain planned. Do not present them as current.',
	},
} as const;

export const MARKETING_ARCHITECTURE_CTA = {
	heading: 'See where each control lives',
	headingId: 'architecture-demo-cta',
	body: 'Enter with mock identity at /login, or read the implemented controls. Synthetic data only. No hosted production and no HIPAA certification claim.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'View security', href: '/security'},
} as const;
