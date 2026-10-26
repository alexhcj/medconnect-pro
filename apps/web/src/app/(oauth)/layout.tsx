import type {Metadata} from 'next';

export const metadata: Metadata = {
	title: 'Sign in | MedConnect Pro',
	robots: {index: false, follow: false},
};

/** OAuth landing group (FE-050): same metadata as /login, deliberately without the auth brand header. */
export default function OAuthLayout({children}: {children: React.ReactNode}) {
	return children;
}
