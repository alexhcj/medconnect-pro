'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {useCreateTelehealthSession} from '@/lib/hooks/use-telehealth';
import {telehealthActionErrorMessage} from '@/lib/telehealth/action-error';
import {telehealthSessionPath} from '@/lib/telehealth/joinable';

const JOIN_CLASS =
	'inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50';

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
	const create = useCreateTelehealthSession();

	return (
		<div className="flex flex-col items-start gap-2">
			{create.isError && (
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">
						{telehealthActionErrorMessage(create.error, 'Unable to start this telehealth visit.')}
					</p>
				</div>
			)}
			<button
				type="button"
				className={JOIN_CLASS}
				disabled={create.isPending}
				onClick={() =>
					create.mutate(appointmentId, {
						onSuccess: (session) => router.push(`/dashboard/telehealth/${session.id}`),
					})
				}
			>
				Join visit
			</button>
		</div>
	);
}
