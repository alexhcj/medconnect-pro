import {MarketingHome} from '@/components/marketing/marketing-home';
import {marketingMetadata} from '@/lib/marketing/metadata';

export const metadata = marketingMetadata(
	'Home',
	'MedConnect Pro is a healthcare-oriented practice platform demonstration. Synthetic demo data only; not a certified production system.',
);

export default function MarketingHomePage() {
	return <MarketingHome />;
}
