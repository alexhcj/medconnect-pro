import {LOGIN_PATH} from '@/lib/auth/paths';

export const MARKETING_SECURITY_HERO = {
	eyebrow: 'Security',
	heading: 'Security-focused architecture, not a certified production system',
	headingId: 'security-heading',
	body: 'The demo models privacy-by-design engineering patterns for a multi-tenant practice platform. It is not HIPAA certified and does not implement production OAuth.',
	primaryCta: {label: 'Go to demo', href: '/demo'},
	secondaryCta: {label: 'About the project', href: '/about'},
} as const;

export const MARKETING_SECURITY_CALLOUT = {
	heading: 'Not HIPAA certified. Not production identity.',
	headingId: 'security-qualification',
	body: 'The demo models security-focused, privacy-by-design patterns. Sign-in uses a mock identity provider. It is not production OAuth 2.0 or OIDC with PKCE, and it is not a certified production healthcare system.',
} as const;

export const MARKETING_SECURITY_CONTROLS = {
	heading: 'Implemented controls',
	headingId: 'implemented-controls',
	items: [
		{
			title: 'Mock identity',
			description:
				'Demo sessions via the existing mock IdP, with opaque bearer sessions. Not production OAuth or OIDC.',
			detail: 'Refresh-token rotation and idle expiry are in the demo session model.',
			status: 'Implemented pattern',
		},
		{
			title: 'RBAC and resource authorization',
			description:
				'Role and permission checks in the API. Frontend checks are UX only; Nest is authoritative.',
			detail: 'Identity, then tenant, then role, then permission, then resource.',
			status: 'Implemented pattern',
		},
		{
			title: 'Tenant isolation',
			description:
				'Practice-owned records are scoped server-side. Browser-supplied tenant IDs are not trusted.',
			detail: 'Tenant scoping in services plus PostgreSQL RLS on business tables.',
			status: 'Implemented pattern',
		},
		{
			title: 'Audit events',
			description:
				'Sensitive operations emit audit events. Administration includes an audit viewer. Synthetic data only.',
			detail: 'Auth, patient, document, appointment, telehealth, and billing actions.',
			status: 'Implemented pattern',
		},
		{
			title: 'PostgreSQL RLS',
			description:
				'Row-level security on tenant-owned tables, with a least-privilege application database role.',
			detail: 'Runtime uses medconnect_app, not the table-owner role.',
			status: 'Implemented pattern',
		},
		{
			title: 'Document ACL',
			description:
				'Authorized list and download of patient documents, with access audited. Local store; not S3/KMS.',
			detail: 'PDF, PNG, and JPEG up to 5 MiB after type checks.',
			status: 'Implemented pattern',
		},
	],
} as const;

export const MARKETING_SECURITY_AUTHORIZATION = {
	heading: 'Authorization model',
	headingId: 'authorization-model',
	note: 'Frontend checks are UX only. Nest authorization is authoritative.',
	steps: [
		{title: 'Identity', description: 'Mock IdP session'},
		{title: 'Practice / tenant', description: 'Server-resolved boundary'},
		{title: 'Role', description: 'Practice and platform roles'},
		{title: 'Permission', description: 'Grant catalog in the API'},
		{title: 'Resource', description: 'Ownership or assignment'},
	],
} as const;

export const MARKETING_SECURITY_NOT_IN_DEMO = {
	heading: 'What is not in this demo',
	headingId: 'not-in-this-demo',
	items: [
		{
			title: 'Production OAuth',
			description:
				'OAuth 2.0 / OIDC with Authorization Code + PKCE is the target identity model, not this demo.',
			detail: 'Do not describe mock identity as production OAuth.',
			status: 'Not shipped',
		},
		{
			title: 'Production MFA',
			description:
				'A mock MFA challenge exists. Production TOTP or WebAuthn is not implemented.',
			detail: 'The live UI does not complete a production MFA flow.',
			status: 'Not shipped',
		},
		{
			title: 'Hosted production',
			description:
				'Encryption at rest, edge TLS, and cloud deploy are later infrastructure.',
			detail: 'Do not claim a hosted production or AWS deployment.',
			status: 'Not shipped',
		},
		{
			title: 'HIPAA certification',
			description:
				'This demonstration is not HIPAA certified or suitable for real patient data.',
			detail:
				'Use qualified language: security-focused architecture, synthetic demo data.',
			status: 'Must not claim',
		},
	],
} as const;

export const MARKETING_SECURITY_CTA = {
	heading: 'Explore with mock identity',
	headingId: 'security-demo-cta',
	body: 'Sign in at /login. Synthetic data only. No hosted production and no HIPAA certification claim.',
	primaryCta: {label: 'Sign in to the demo', href: LOGIN_PATH},
	secondaryCta: {label: 'View administration', href: '/platform/administration'},
} as const;
