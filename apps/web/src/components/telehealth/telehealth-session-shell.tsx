'use client';

import type {ReactNode} from 'react';
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {VisitEnded} from '@/components/telehealth/visit-ended';
import {VisitWrapUp} from '@/components/telehealth/visit-wrap-up';
import {readCallSummary} from '@/lib/telehealth/call-summary';
import {findNextAppointment, followUpHref} from '@/lib/telehealth/next-appointment';
import {DailyMediaSession} from '@/components/telehealth/daily-media-session';
import {MockCallStage} from '@/components/telehealth/mock-call-stage';
import {
	formatTelehealthRange,
	TELEHEALTH_DEMO_NOTICE,
	TelehealthAppointmentLinkage,
} from '@/components/telehealth/telehealth-appointment-linkage';
import {VisitUnavailable} from '@/components/telehealth/visit-unavailable';
import {GreenRoom} from '@/components/telehealth/green-room';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {ApiError} from '@/lib/api/http';
import {mockViewerPersonaKey} from '@/lib/auth/demo-accounts';
import {canAccessTelehealth} from '@/lib/auth/telehealth-access';
import {
	useEndTelehealthSession,
	useJoinTelehealthSession,
	useTelehealthSession,
} from '@/lib/hooks/use-telehealth';
import {useAppointments} from '@/lib/hooks/use-medical';
import {useSessionStatus} from '@/lib/hooks/use-session';
import type {JoinChoices} from '@/lib/telehealth/join-choices';
import {VISIT_ALREADY_STARTED_TEXT, visitView} from '@/lib/telehealth/visit-view';
import {mediaTileInitials, localParticipantDisplayName} from '@/lib/telehealth/media-participant';
import type {TelehealthSession} from '@/types/medical/telehealth-session';
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

function greenRoomInitials(role: Parameters<typeof localParticipantDisplayName>[1], session: TelehealthSession): string {
	return mediaTileInitials(localParticipantDisplayName(session, role));
}

function isClosedVisitError(error: unknown): boolean {
	return (
		error instanceof ApiError &&
		(error.code === 'SESSION_ENDED' || error.code === 'SESSION_NOT_JOINABLE')
	);
}

export function TelehealthSessionShell({sessionId}: {sessionId: string}) {
	const {session: authSession, isLoading: isAuthLoading} = useSessionStatus();
	const canAccess = !isAuthLoading && canAccessTelehealth(authSession?.userRole);
	const visit = useTelehealthSession(sessionId, canAccess);
	// Server host rule (BE-027). A UX hint only; Nest enforces it on POST .../end.
	const canEnd = visit.data?.viewerCanEnd === true;
	const join = useJoinTelehealthSession();
	const endVisit = useEndTelehealthSession();
	const mockMode = isMockMode();
	const [joinChoices, setJoinChoices] = useState<JoinChoices | undefined>();
	const [joinedHere, setJoinedHere] = useState(false);
	// FE-065: the persona outlives the green room, so it is stopped here when the visit ends or this page goes away.
	const personaCamera = joinChoices?.personaCamera;
	useEffect(() => () => personaCamera?.stop(), [personaCamera]);
	const visitEnded = visit.data?.state === 'ended';
	useEffect(() => {
		if (visitEnded) {
			personaCamera?.stop();
		}
	}, [visitEnded, personaCamera]);
	// Live mode reads the caller's own key from Nest. Mock mode has no session, so it maps the fixture account.
	const personaKey = visit.data?.viewerPersonaKey ?? (mockMode ? mockViewerPersonaKey(authSession?.userId) : null);
	// The visit title is the appointment reason (notes), never the diagnosis list (SEC-013 scope 6).
	const appointments = useAppointments(canAccess);
	const appointment = appointments.data?.find((item) => item.id === visit.data?.appointmentId);
	const reason = appointment?.notes?.trim();
	const nextAppointment =
		authSession?.userRole === 'PATIENT' && visit.data
			? findNextAppointment(appointments.data, visit.data.appointmentId)
			: undefined;
	const visitTitle = reason ? `Video visit — ${reason}` : 'Video visit';
	// The stage header already says "Video visit" above the title.
	const stageTitle = reason ? `${reason} · ${visit.data?.patientName ?? ''}`.replace(/ · $/, '') : 'Consultation';
	// After End visit the session flips to `ended` and this page shows the wrap-up in place (FE-064).
	const endMutation = () => endVisit.mutate(sessionId);
	// Daily dropped us or the keep-alive was refused: ask Nest whether the host ended the visit.
	const recheckVisit = () => void visit.refetch();
	const endErrorText = endVisit.isError
		? telehealthActionErrorMessage(endVisit.error, 'Unable to end this session.')
		: undefined;

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
	// A visit that was live gets the wrap-up or confirmation; one that never started keeps the plain card.
	const endedAfterLive = visit.data?.state === 'ended' && Boolean(visit.data.joinedAt);
	// FE-067: a later joiner of a live visit gets the green room until they join from this page.
	const view = visit.data ? visitView({state: visit.data.state, joinedHere, closed}) : 'closed';

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

					{closed && endedAfterLive && canEnd && (
						<VisitWrapUp
							session={visit.data}
							summary={readCallSummary(sessionId)}
							followUpHref={followUpHref(appointment?.patientId, appointment?.providerId)}
						/>
					)}

					{closed && endedAfterLive && !canEnd && (
						<VisitEnded session={visit.data} nextAppointment={nextAppointment} />
					)}

					{closed && !endedAfterLive && (
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

					{view === 'green_room' && (
						<GreenRoom
							visitTitle={visitTitle}
							inProgressText={visit.data.state === 'in_session' ? VISIT_ALREADY_STARTED_TEXT : undefined}
							scheduleText={`${formatTelehealthRange(visit.data.start, visit.data.end)} · ${visit.data.providerName} with ${visit.data.patientName}`}
							initials={greenRoomInitials(authSession?.userRole, visit.data)}
							personaKey={personaKey}
							displayName={localParticipantDisplayName(visit.data, authSession?.userRole)}
							onJoin={(choices) => {
								setJoinChoices(choices);
								join.mutate(sessionId, {onSuccess: () => setJoinedHere(true)});
							}}
							isJoining={join.isPending}
							errorMessage={
								join.isError
									? telehealthActionErrorMessage(join.error, 'Unable to join this session.')
									: undefined
							}
						/>
					)}

						{view === 'stage' && mockMode && (
							<MockCallStage
								session={visit.data}
								userRole={authSession?.userRole}
								visitTitle={stageTitle}
								canEnd={canEnd}
								isEnding={endVisit.isPending}
								endError={endErrorText}
								onEnd={endMutation}
							/>
						)}

						{view === 'stage' && !mockMode && (
							<DailyMediaSession
								sessionId={sessionId}
								session={visit.data}
								visitTitle={stageTitle}
								canEnd={canEnd}
								viewerRole={authSession?.userRole}
								onEndedSuspected={recheckVisit}
								onVisitClosed={recheckVisit}
								joinChoices={joinChoices}
								isEnding={endVisit.isPending}
								endError={endErrorText}
								onEnd={endMutation}
							/>
						)}
				</div>
			)}
		</SessionChrome>
	);
}
