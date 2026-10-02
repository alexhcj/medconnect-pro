import type {Metadata} from 'next';
import {MarketingShell} from '@/components/marketing/marketing-shell';

export const metadata: Metadata = {
	metadataBase: new URL('http://localhost:3000'),
	title: {
		default: 'MedConnect Pro',
		template: '%s · MedConnect Pro',
	},
	description:
		'A healthcare-oriented practice platform demonstration for portfolio and interviews. Synthetic demo data only; not a certified production system.',
};

export default function MarketingLayout({children}: {children: React.ReactNode}) {
	return <MarketingShell>{children}</MarketingShell>;
}
