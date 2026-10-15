import {MarketingFeaturePage} from '@/components/marketing/marketing-feature-page';
import {FEATURE_PAGE_METADATA} from '@/components/marketing/marketing-feature-pages-copy';
import {marketingMetadata} from '@/lib/marketing/metadata';

const page = FEATURE_PAGE_METADATA['patient-management'];

export const metadata = marketingMetadata(page.title, page.description, '/platform/patient-management');

export default function PatientManagementPage() {
	return <MarketingFeaturePage slug="patient-management" />;
}
