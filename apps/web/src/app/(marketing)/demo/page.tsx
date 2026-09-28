import Link from 'next/link';
import {buttonVariants} from '@/components/ui/button';
import {MarketingPage} from '@/components/marketing/marketing-page';
import {LOGIN_PATH} from '@/lib/auth/paths';
import {marketingMetadata} from '@/lib/marketing/metadata';
import {cn} from '@/lib/utils/utils';

export const metadata = marketingMetadata(
	'Demo',
	'Explore the MedConnect Pro dashboard through the existing mock identity provider. Synthetic demo data only.',
);

export default function DemoPage() {
	return (
		<MarketingPage
			title="Explore the demo"
			intro="Sign in through the existing mock identity provider. Demo credentials are shown on the sign-in page. This is not production identity infrastructure."
		>
			<p className="text-base leading-relaxed text-gray-700">
				The dashboard uses synthetic records. After you sign in, you can walk through patient,
				appointment, telehealth session-shell, billing invoice, and administration screens that
				already exist in the application.
			</p>
			<p>
				<Link href={LOGIN_PATH} className={cn(buttonVariants({size: 'lg'}))}>
					Sign in to the demo
				</Link>
			</p>
		</MarketingPage>
	);
}
