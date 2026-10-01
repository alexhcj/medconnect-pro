import {MarketingSecurity} from '@/components/marketing/marketing-security';
import {marketingMetadata} from '@/lib/marketing/metadata';

export const metadata = marketingMetadata(
	'Security',
	'Security-focused engineering patterns in the MedConnect Pro demo: mock identity, RBAC, tenant isolation, and audit events. Not HIPAA certified and not production OAuth.',
);

export default function SecurityPage() {
	return <MarketingSecurity />;
}
