import {FeaturePageLayout} from '@/components/marketing/feature-page-layout';
import {
	FEATURE_PAGES,
	type FeaturePageSlug,
} from '@/components/marketing/marketing-feature-pages-copy';

export function MarketingFeaturePage({slug}: {slug: FeaturePageSlug}) {
	return <FeaturePageLayout {...FEATURE_PAGES[slug]} />;
}
