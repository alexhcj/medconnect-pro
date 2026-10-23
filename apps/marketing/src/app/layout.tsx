import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import {PreviewBanner} from '@/components/marketing/preview-banner';
import {siteUrl} from '@/lib/marketing/public-urls';
import './globals.css';

const inter = Inter({
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-inter',
});

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl()),
	title: {
		default: 'MedConnect Pro',
		template: '%s · MedConnect Pro',
	},
	description:
		'A healthcare-oriented practice platform demonstration for portfolio and interviews. Synthetic demo data only; not a certified production system.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
	return (
		<html lang="en" className={inter.variable}>
			<body className="font-sans antialiased text-foreground">
				<PreviewBanner />
				{children}
			</body>
		</html>
	);
}
