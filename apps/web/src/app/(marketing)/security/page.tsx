import {MarketingPage} from '@/components/marketing/marketing-page';
import {marketingMetadata} from '@/lib/marketing/metadata';

export const metadata = marketingMetadata(
	'Security',
	'Security-focused engineering patterns in the MedConnect Pro demo: mock identity, RBAC, tenant isolation, and audit events. Not HIPAA certified and not production OAuth.',
);

export default function SecurityPage() {
	return (
		<MarketingPage
			title="Security"
			intro="The demo models security-focused, privacy-by-design engineering patterns for a multi-tenant practice platform. It is not HIPAA certified and does not implement production OAuth."
		>
			<ul className="list-disc space-y-3 pl-5 text-base text-gray-700">
				<li>Mock identity provider for sign-in. This is not production OAuth 2.0 or OIDC with PKCE.</li>
				<li>Role-based access control and resource-level authorization in the API.</li>
				<li>Tenant isolation for practice-owned records.</li>
				<li>Audit events for sensitive operations in the demo.</li>
				<li>Synthetic data only. Do not introduce real patient information.</li>
			</ul>
		</MarketingPage>
	);
}
