import {MarketingAbout} from '@/components/marketing/marketing-about';
import {marketingMetadata} from '@/lib/marketing/metadata';

export const metadata = marketingMetadata(
	'About',
	'MedConnect Pro is a portfolio and interview demonstration of a multi-tenant healthcare SaaS architecture. All patient information is synthetic.',
);

export default function AboutPage() {
	return <MarketingAbout />;
}
