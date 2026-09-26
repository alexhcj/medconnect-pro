'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {JoinTelehealthVisitControl} from '@/components/telehealth/join-telehealth-visit-control';
import {TELEHEALTH_DEMO_NOTICE, TelehealthAppointmentLinkage} from '@/components/telehealth/telehealth-appointment-linkage';
import {canAccessTelehealth} from '@/lib/auth/telehealth-access';
import {useJoinableTelehealthVisits} from '@/lib/hooks/use-telehealth';
import {useSessionStatus} from '@/lib/hooks/use-session';

export function TelehealthLobby() {
	const {session, isLoading: isSessionLoading} = useSessionStatus();
	const canAccess = !isSessionLoading && canAccessTelehealth(session?.userRole);
	const visits = useJoinableTelehealthVisits(canAccess);

	return (
		<div>
			<h1 className="mb-2 text-2xl font-bold text-gray-900">Telehealth</h1>
			<p className="mb-6 text-sm text-gray-600">{TELEHEALTH_DEMO_NOTICE}</p>

			{isSessionLoading && (
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading telehealth</span>
				</div>
			)}

			{!isSessionLoading && !canAccess && (
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">You do not have access to telehealth sessions.</p>
				</div>
			)}

			{canAccess && (
				<Card>
					<CardHeader>
						<p className="text-sm text-gray-600">Joinable telehealth appointments for this practice.</p>
					</CardHeader>
					<CardContent>
						{visits.isPending && (
							<div className="space-y-3" aria-busy="true">
								<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
								<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
								<span className="sr-only">Loading telehealth visits</span>
							</div>
						)}

						{visits.isError && (
							<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
								<p className="text-sm text-gray-700">Unable to load telehealth visits.</p>
								<Button type="button" className="mt-3" variant="outline" onClick={() => visits.refetch()}>
									Retry
								</Button>
							</div>
						)}

						{!visits.isPending && !visits.isError && (visits.data?.length ?? 0) === 0 && (
							<p className="text-sm text-gray-600">No telehealth visits are ready to join.</p>
						)}

						{!visits.isPending && !visits.isError && (visits.data?.length ?? 0) > 0 && (
							<ul className="space-y-3" aria-label="Telehealth visits">
								{visits.data?.map((visit) => (
									<li
										key={visit.id}
										className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 md:flex-row md:items-start md:justify-between"
									>
										<TelehealthAppointmentLinkage session={visit} />
										<JoinTelehealthVisitControl appointmentId={visit.appointmentId} />
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
