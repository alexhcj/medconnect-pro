import {MarketingFeaturePage} from '@/components/marketing/marketing-feature-page';
import {FEATURE_PAGE_METADATA} from '@/components/marketing/marketing-feature-pages-copy';
import {marketingMetadata} from '@/lib/marketing/metadata';

const page = FEATURE_PAGE_METADATA.analytics;

export const metadata = marketingMetadata(page.title, page.description);

export default function AnalyticsFeaturePage() {
	return <MarketingFeaturePage slug="analytics" />;
}
