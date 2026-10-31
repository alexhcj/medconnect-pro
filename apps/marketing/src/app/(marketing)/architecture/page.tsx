import {MarketingArchitecture} from '@/components/marketing/marketing-architecture';
import {marketingMetadata} from '@/lib/marketing/metadata';

export const metadata = marketingMetadata(
	'Architecture',
	'How the MedConnect Pro demo fits together: a system map, the request and authorization flow, and what is current versus planned. Synthetic data only.',
	'/architecture',
);

export default function ArchitecturePage() {
	return <MarketingArchitecture />;
}
