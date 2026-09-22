'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {ApiError} from '@/lib/api/http';
import {loginUrl} from '@/lib/auth/paths';
import {useCurrentSession} from '@/lib/hooks/use-session';
import {SessionProvider} from '@/components/providers/session-provider';

export function DashboardAuthGate({children}: {children: React.ReactNode}) {
	const router = useRouter();
	const {data: session, isPending, isError, error} = useCurrentSession();
	const unauthorized =
		(isError && error instanceof ApiError && error.status === 401) ||
		(isError && error.message.toLowerCase().includes('unauthorized')) ||
		(!isPending && !session);

	useEffect(() => {
		if (unauthorized) {
			router.replace(loginUrl('unauthorized'));
		}
	}, [unauthorized, router]);

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<p className="text-sm text-gray-600" role="status">
					Checking session…
				</p>
			</div>
		);
	}

	if (unauthorized || !session) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<p className="text-sm text-gray-600" role="status">
					Redirecting to login…
				</p>
			</div>
		);
	}

	return <SessionProvider>{children}</SessionProvider>;
}
