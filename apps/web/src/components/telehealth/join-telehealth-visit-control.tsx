'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ApiError} from '@/lib/api/http';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {canWriteAppointments} from '@/lib/auth/appointment-access';
import {useSessionStatus} from '@/lib/hooks/use-session';
import {useCreateTelehealthSession, useFindOpenTelehealthSession} from '@/lib/hooks/use-telehealth';
import {telehealthActionErrorMessage} from '@/lib/telehealth/action-error';
import {telehealthSessionPath} from '@/lib/telehealth/joinable';

const JOIN_CLASS =
	'inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50';

const NOT_OPEN_YET = 'This visit is not open yet.';

export function JoinTelehealthVisitControl({appointmentId}: {appointmentId: string}) {
	if (isMockMode()) {
		return (
			<Link href={telehealthSessionPath(appointmentId)} className={JOIN_CLASS}>
				Join visit
			</Link>
		);
	}

	return <LiveJoinTelehealthVisitButton appointmentId={appointmentId} />;
}

function LiveJoinTelehealthVisitButton({appointmentId}: {appointmentId: string}) {
	const router = useRouter();
	const {session, isLoading} = useSessionStatus();
	const canCreate = !isLoading && canWriteAppointments(session?.permissions);
	const create = useCreateTelehealthSession();
	const findOpen = useFindOpenTelehealthSession();
	const action = canCreate ? create : findOpen;
	const notOpenYet =
		!canCreate && findOpen.isError && findOpen.error instanceof ApiError && findOpen.error.status === 404;

	function openSession(sessionId: string) {
		router.push(`/dashboard/telehealth/${sessionId}`);
	}

	return (
		<div className="flex flex-col items-start gap-2">
			{notOpenYet && (
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">{NOT_OPEN_YET}</p>
				</div>
			)}
			{action.isError && !notOpenYet && (
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">
						{telehealthActionErrorMessage(
							action.error,
							canCreate
								? 'Unable to start this telehealth visit.'
								: 'Unable to open this telehealth visit.',
						)}
					</p>
				</div>
			)}
			<button
				type="button"
				className={JOIN_CLASS}
				disabled={isLoading || action.isPending}
				onClick={() => {
					if (isLoading) {
						return;
					}
					if (canCreate) {
						create.mutate(appointmentId, {
							onSuccess: (opened) => openSession(opened.id),
						});
						return;
					}
					findOpen.mutate(appointmentId, {
						onSuccess: (opened) => openSession(opened.id),
					});
				}}
			>
				Join visit
			</button>
		</div>
	);
}
