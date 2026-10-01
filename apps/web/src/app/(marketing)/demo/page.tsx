import {MarketingDemo} from '@/components/marketing/marketing-demo';
import {marketingMetadata} from '@/lib/marketing/metadata';

export const metadata = marketingMetadata(
	'Demo',
	'Explore the MedConnect Pro dashboard through the existing mock identity provider. Synthetic demo data only.',
);

export default function DemoPage() {
	return <MarketingDemo />;
}
