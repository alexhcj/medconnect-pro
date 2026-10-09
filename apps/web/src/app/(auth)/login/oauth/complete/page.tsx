'use client';

import {Suspense} from 'react';
import {OAuthComplete} from '@/components/auth/oauth-complete';

export default function OAuthCompletePage() {
	return (
		<Suspense>
			<OAuthComplete />
		</Suspense>
	);
}
