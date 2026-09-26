'use client';

import type {ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {MediaPlaceholders} from '@/components/telehealth/media-placeholders';
import {TELEHEALTH_DEMO_NOTICE, TelehealthAppointmentLinkage} from '@/components/telehealth/telehealth-appointment-linkage';
import {WaitingRoom} from '@/components/telehealth/waiting-room';
import {canAccessTelehealth} from '@/lib/auth/telehealth-access';
import {
	useJoinTelehealthSession,
	useLeaveTelehealthSession,
	useTelehealthSession,
} from '@/lib/hooks/use-telehealth';
import {useSessionStatus} from '@/lib/hooks/use-session';

function SessionChrome({children}: {children: ReactNode}) {
	return (
		<div>
			<Link
				href="/dashboard/telehealth"
				className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
			>
				Back to telehealth
			</Link>
			<div className="mt-4">{children}</div>
		</div>
	);
}

export function TelehealthSessionShell({sessionId}: {sessionId: string}) {
	const router = useRouter();
	const {session: authSession, isLoading: isAuthLoading} = useSessionStatus();
	const canAccess = !isAuthLoading && canAccessTelehealth(authSession?.userRole);
	const visit = useTelehealthSession(sessionId, canAccess);
	const join = useJoinTelehealthSession();
	const leave = useLeaveTelehealthSession();

	if (isAuthLoading) {
		return (
			<SessionChrome>
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading telehealth session</span>
				</div>
			</SessionChrome>
		);
	}

	if (!canAccess) {
		return (
			<SessionChrome>
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">You do not have access to telehealth sessions.</p>
				</div>
			</SessionChrome>
		);
	}

	return (
		<SessionChrome>
			<h1 className="mb-2 text-2xl font-bold text-gray-900">Telehealth session</h1>
			<p className="mb-6 text-sm text-gray-600">{TELEHEALTH_DEMO_NOTICE}</p>

			{visit.isPending && (
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading telehealth session</span>
				</div>
			)}

			{visit.isError && (
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">Unable to load this telehealth session.</p>
					<Button type="button" className="mt-3" variant="outline" onClick={() => visit.refetch()}>
						Retry
					</Button>
				</div>
			)}

			{!visit.isPending && !visit.isError && visit.data && (
				<div className="space-y-6">
					<section className="rounded-lg border border-gray-200 bg-white p-4" aria-labelledby="telehealth-appointment-heading">
						<h2 id="telehealth-appointment-heading" className="mb-3 text-lg font-semibold text-gray-900">
							Appointment
						</h2>
						<TelehealthAppointmentLinkage session={visit.data} />
					</section>

					{visit.data.state !== 'in_session' && (
						<WaitingRoom
							onJoin={() => join.mutate(sessionId)}
							isJoining={join.isPending}
							errorMessage={join.isError ? 'Unable to join this session.' : undefined}
						/>
					)}

					{visit.data.state === 'in_session' && (
						<div className="space-y-4">
							<MediaPlaceholders />
							{leave.isError && (
								<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
									<p className="text-sm text-gray-700">Unable to leave this session.</p>
								</div>
							)}
							<Button
								type="button"
								variant="destructive"
								isLoading={leave.isPending}
								onClick={() =>
									leave.mutate(sessionId, {
										onSuccess: () => router.push('/dashboard/telehealth'),
									})
								}
							>
								Leave session
							</Button>
						</div>
					)}
				</div>
			)}
		</SessionChrome>
	);
}
