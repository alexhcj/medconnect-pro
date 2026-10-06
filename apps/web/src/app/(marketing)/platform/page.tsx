import {MarketingPlatform} from '@/components/marketing/marketing-platform';
import {marketingMetadata} from '@/lib/marketing/metadata';

export const metadata = marketingMetadata(
	'Platform',
	'Overview of MedConnect Pro demo modules: patients, appointments, telehealth session shell, billing invoices, live dashboard overview cards, and administration.',
);

export default function PlatformPage() {
	return <MarketingPlatform />;
}
