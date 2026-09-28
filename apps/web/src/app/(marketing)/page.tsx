import Link from 'next/link';
import {MarketingPage} from '@/components/marketing/marketing-page';
import {LOGIN_PATH} from '@/lib/auth/paths';
import {marketingMetadata} from '@/lib/marketing/metadata';

export const metadata = marketingMetadata(
	'Home',
	'MedConnect Pro is a healthcare-oriented practice platform demonstration. Synthetic demo data only; not a certified production system.',
);

export default function MarketingHomePage() {
	return (
		<MarketingPage
			title="MedConnect Pro"
			intro="A healthcare-oriented practice platform demonstration for portfolio, interviews, and potential-client presentations. All records are synthetic. This is not a certified production healthcare system."
		>
			<ul className="space-y-3 text-base text-gray-700">
				<li>
					<Link
						href="/platform"
						className="font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
					>
						Platform
					</Link>
					{' — '}
					demo modules for patients, appointments, telehealth session shell, billing invoices, and
					administration.
				</li>
				<li>
					<Link
						href="/security"
						className="font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
					>
						Security
					</Link>
					{' — '}
					security-focused engineering patterns used in the demo, including mock identity and RBAC.
				</li>
				<li>
					<Link
						href="/demo"
						className="font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
					>
						Demo
					</Link>
					{' — '}
					sign in through the existing mock identity provider at{' '}
					<Link
						href={LOGIN_PATH}
						className="font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
					>
						{LOGIN_PATH}
					</Link>
					.
				</li>
			</ul>
		</MarketingPage>
	);
}
