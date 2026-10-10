'use client';

import type {ReactNode} from 'react';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {DailyMediaSession} from '@/components/telehealth/daily-media-session';
import {MediaPlaceholders} from '@/components/telehealth/media-placeholders';
import {TELEHEALTH_DEMO_NOTICE, TelehealthAppointmentLinkage} from '@/components/telehealth/telehealth-appointment-linkage';
import {VisitUnavailable} from '@/components/telehealth/visit-unavailable';
import {WaitingRoom} from '@/components/telehealth/waiting-room';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {ApiError} from '@/lib/api/http';
import {canAccessTelehealth, canEndTelehealthVisit} from '@/lib/auth/telehealth-access';
import {
	useEndTelehealthSession,
	useJoinTelehealthSession,
	useTelehealthSession,
} from '@/lib/hooks/use-telehealth';
import {useSessionStatus} from '@/lib/hooks/use-session';
import {telehealthActionErrorMessage} from '@/lib/telehealth/action-error';

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

function isClosedVisitError(error: unknown): boolean {
	return (
		error instanceof ApiError &&
		(error.code === 'SESSION_ENDED' || error.code === 'SESSION_NOT_JOINABLE')
	);
}

export function TelehealthSessionShell({sessionId}: {sessionId: string}) {
	const router = useRouter();
	const {session: authSession, isLoading: isAuthLoading} = useSessionStatus();
	const canAccess = !isAuthLoading && canAccessTelehealth(authSession?.userRole);
	const canEnd = canEndTelehealthVisit(authSession?.userRole);
	const visit = useTelehealthSession(sessionId, canAccess);
	const join = useJoinTelehealthSession();
	const endVisit = useEndTelehealthSession();
	const mockMode = isMockMode();
	const [leftMockMedia, setLeftMockMedia] = useState(false);

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

	const closed =
		visit.data?.state === 'ended' || isClosedVisitError(visit.error) || isClosedVisitError(join.error);

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

			{visit.isError && !closed && (
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">
						{telehealthActionErrorMessage(visit.error, 'Unable to load this telehealth session.')}
					</p>
					<Button type="button" className="mt-3" variant="outline" onClick={() => visit.refetch()}>
						Retry
					</Button>
				</div>
			)}

			{closed && !visit.data && (
				<VisitUnavailable
					title="This visit is not available"
					message={telehealthActionErrorMessage(
						join.error ?? visit.error,
						'This telehealth session cannot be joined.',
					)}
				/>
			)}

			{!visit.isPending && visit.data && (
				<div className="space-y-6">
					<section className="rounded-lg border border-gray-200 bg-white p-4" aria-labelledby="telehealth-appointment-heading">
						<h2 id="telehealth-appointment-heading" className="mb-3 text-lg font-semibold text-gray-900">
							Appointment
						</h2>
						<TelehealthAppointmentLinkage session={visit.data} />
					</section>

					{closed && (
						<VisitUnavailable
							title={visit.data.state === 'ended' ? 'This visit has ended' : 'This visit is not available'}
							message={
								visit.data.state === 'ended'
									? 'The consultation is closed. You cannot rejoin or mint live media for this session.'
									: telehealthActionErrorMessage(
											join.error ?? visit.error,
											'This telehealth session cannot be joined.',
										)
							}
						/>
					)}

					{!closed && visit.data.state === 'waiting' && (
						<WaitingRoom
							onJoin={() => join.mutate(sessionId)}
							isJoining={join.isPending}
							errorMessage={
								join.isError
									? telehealthActionErrorMessage(join.error, 'Unable to join this session.')
									: undefined
							}
						/>
					)}

					{!closed && visit.data.state === 'in_session' && mockMode && (
						<div className="space-y-4">
							{leftMockMedia ? (
								<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
									<p className="text-sm text-gray-700">You left the call. The visit is still open.</p>
									<Button
										type="button"
										className="mt-3"
										variant="outline"
										onClick={() => setLeftMockMedia(false)}
									>
										Rejoin call
									</Button>
								</div>
							) : (
								<MediaPlaceholders />
							)}
							{endVisit.isError && (
								<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
									<p className="text-sm text-gray-700">
										{telehealthActionErrorMessage(endVisit.error, 'Unable to end this session.')}
									</p>
								</div>
							)}
							<div className="flex flex-wrap gap-2">
								{!leftMockMedia && (
									<Button type="button" variant="outline" onClick={() => setLeftMockMedia(true)}>
										Leave call
									</Button>
								)}
								{canEnd && (
									<Button
										type="button"
										variant="destructive"
										isLoading={endVisit.isPending}
										onClick={() =>
											endVisit.mutate(sessionId, {
												onSuccess: () => router.push('/dashboard/telehealth'),
											})
										}
									>
										End session
									</Button>
								)}
							</div>
						</div>
					)}

					{!closed && visit.data.state === 'in_session' && !mockMode && (
						<DailyMediaSession
							sessionId={sessionId}
							session={visit.data}
							userRole={authSession?.userRole}
							canEnd={canEnd}
							isEnding={endVisit.isPending}
							endError={
								endVisit.isError
									? telehealthActionErrorMessage(endVisit.error, 'Unable to end this session.')
									: undefined
							}
							onEnd={() =>
								endVisit.mutate(sessionId, {
									onSuccess: () => router.push('/dashboard/telehealth'),
								})
							}
						/>
					)}
				</div>
			)}
		</SessionChrome>
	);
}
