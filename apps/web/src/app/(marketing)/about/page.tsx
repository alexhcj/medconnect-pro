import {MarketingPage} from '@/components/marketing/marketing-page';
import {marketingMetadata} from '@/lib/marketing/metadata';

export const metadata = marketingMetadata(
	'About',
	'MedConnect Pro is a portfolio and interview demonstration of a multi-tenant healthcare SaaS architecture. All patient information is synthetic.',
);

export default function AboutPage() {
	return (
		<MarketingPage
			title="About"
			intro="MedConnect Pro is a portfolio and interview demonstration of how a senior engineering team could design a multi-tenant healthcare SaaS product. It is production-oriented in architecture, not a deployed clinical service."
		>
			<p className="text-base leading-relaxed text-gray-700">
				The application uses synthetic demo data only. Names, identifiers, clinical details, and
				appointments are fictional. The public marketing pages describe implemented demo
				capabilities without claiming HIPAA certification, production identity, live video, or
				hosted payments.
			</p>
		</MarketingPage>
	);
}
