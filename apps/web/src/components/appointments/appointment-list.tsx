'use client';

import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {
	APPOINTMENT_STATE_LABELS,
	APPOINTMENT_TYPE_LABELS,
} from '@/components/forms/appointment-form-schema';
import {canWriteAppointments} from '@/lib/auth/appointment-access';
import {useAppointments} from '@/lib/hooks/use-medical';
import {useSessionStatus} from '@/lib/hooks/use-session';
import {Appointment} from '@/types/medical/appointment';

function formatRange(start: string, end: string) {
	const startDate = new Date(start);
	const endDate = new Date(end);
	if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
		return `${start} – ${end}`;
	}
	return `${startDate.toLocaleString()} – ${endDate.toLocaleTimeString()}`;
}

function typeLabel(type: Appointment['type']) {
	return APPOINTMENT_TYPE_LABELS[type] ?? type;
}

function stateLabel(state: Appointment['state']) {
	return APPOINTMENT_STATE_LABELS[state] ?? state;
}

const AppointmentList = () => {
	const {session, isLoading: isSessionLoading} = useSessionStatus();
	const canWrite = !isSessionLoading && canWriteAppointments(session?.permissions);
	const appointments = useAppointments();

	return (
		<Card>
			<CardHeader>
				{canWrite && (
					<div className="mb-2 flex justify-end">
						<Link
							href="/dashboard/appointments/new"
							className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
						>
							Schedule appointment
						</Link>
					</div>
				)}
			</CardHeader>
			<CardContent>
				{appointments.isPending && (
					<div className="space-y-3" aria-busy="true">
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<span className="sr-only">Loading appointments</span>
					</div>
				)}

				{appointments.isError && (
					<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
						<p className="text-sm text-gray-700">Unable to load appointments.</p>
						<Button type="button" className="mt-3" variant="outline" onClick={() => appointments.refetch()}>
							Retry
						</Button>
					</div>
				)}

				{!appointments.isPending && !appointments.isError && (appointments.data?.length ?? 0) === 0 && (
					<p className="text-sm text-gray-600">No appointments scheduled.</p>
				)}

				{!appointments.isPending && !appointments.isError && (appointments.data?.length ?? 0) > 0 && (
					<ul className="space-y-3" aria-label="Appointments">
						{appointments.data?.map((appointment) => (
							<li
								key={appointment.id}
								className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
							>
								<div>
									<p className="font-medium text-gray-900">
										{appointment.patientName} · {appointment.providerName}
									</p>
									<p className="mt-1 text-sm text-gray-700">{formatRange(appointment.start, appointment.end)}</p>
								</div>
								<p className="text-sm text-gray-600">
									{typeLabel(appointment.type)} · {stateLabel(appointment.state)}
								</p>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
};

export {AppointmentList};
