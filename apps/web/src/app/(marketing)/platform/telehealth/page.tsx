import {MarketingFeaturePage} from '@/components/marketing/marketing-feature-page';
import {FEATURE_PAGE_METADATA} from '@/components/marketing/marketing-feature-pages-copy';
import {marketingMetadata} from '@/lib/marketing/metadata';

const page = FEATURE_PAGE_METADATA.telehealth;

export const metadata = marketingMetadata(page.title, page.description);

export default function TelehealthFeaturePage() {
	return <MarketingFeaturePage slug="telehealth" />;
}
