import {MarketingFeaturePage} from '@/components/marketing/marketing-feature-page';
import {FEATURE_PAGE_METADATA} from '@/components/marketing/marketing-feature-pages-copy';
import {marketingMetadata} from '@/lib/marketing/metadata';

const page = FEATURE_PAGE_METADATA.administration;

export const metadata = marketingMetadata(page.title, page.description);

export default function AdministrationFeaturePage() {
	return <MarketingFeaturePage slug="administration" />;
}
