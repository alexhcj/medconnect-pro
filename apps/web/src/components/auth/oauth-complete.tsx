'use client';

import {useEffect, useRef} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Loader2} from 'lucide-react';
import {sessionAPI} from '@/lib/api/session-api';
import {queryClient} from '@/lib/api/api';
import {loginUrl} from '@/lib/auth/paths';
import {safeReturnTo} from '@/lib/auth/oauth';

export function OAuthComplete() {
	const router = useRouter();
	const returnTo = safeReturnTo(useSearchParams().get('returnTo'));
	const started = useRef(false);

	useEffect(() => {
		if (started.current) {
			return;
		}
		started.current = true;
		sessionAPI
			.hydrateSession()
			.then((session) => {
				queryClient.setQueryData(['session', 'current'], session);
				router.replace(returnTo);
			})
			.catch(() => {
				router.replace(loginUrl('oauth_failed'));
			});
	}, [returnTo, router]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-canvas p-4">
			<div
				className="w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-8 shadow-sm"
				role="status"
				aria-live="polite"
			>
				<Loader2 className="size-8 animate-spin text-brand motion-reduce:animate-none" aria-hidden="true" />
				<h1 className="text-2xl font-bold text-foreground">Signing you in</h1>
				<p className="text-sm text-foreground-secondary">Finishing sign-in and loading your session…</p>
			</div>
		</div>
	);
}
