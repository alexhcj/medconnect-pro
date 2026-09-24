'use client';

import {Dialog, DialogPanel, DialogTitle} from '@headlessui/react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {
	APPOINTMENT_STATE_LABELS,
	APPOINTMENT_TYPE_LABELS,
} from '@/components/forms/appointment-form-schema';
import {canViewPatientProfile} from '@/lib/auth/patient-profile-access';
import {Appointment} from '@/types/medical/appointment';
import type {Permission} from '@/types/auth/permissions';

function formatRange(start: string, end: string) {
	const startDate = new Date(start);
	const endDate = new Date(end);
	if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
		return `${start} – ${end}`;
	}
	return `${startDate.toLocaleString()} – ${endDate.toLocaleTimeString()}`;
}

interface AppointmentEventDialogProps {
	appointment: Appointment | null;
	permissions: readonly Permission[] | undefined;
	onClose: () => void;
}

export function AppointmentEventDialog({appointment, permissions, onClose}: AppointmentEventDialogProps) {
	const canOpenProfile = canViewPatientProfile(permissions);

	return (
		<Dialog
			open={!!appointment}
			onClose={onClose}
			className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
		>
			<div className="fixed inset-0 bg-black/40" aria-hidden />
			<DialogPanel className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 text-left shadow-xl">
				<DialogTitle className="text-lg font-semibold text-gray-900">Appointment</DialogTitle>
				{appointment && (
					<div className="mt-4 space-y-2 text-sm text-gray-700">
						<p>
							<span className="font-medium text-gray-900">Patient:</span> {appointment.patientName}
						</p>
						<p>
							<span className="font-medium text-gray-900">Provider:</span> {appointment.providerName}
						</p>
						<p>
							<span className="font-medium text-gray-900">Time:</span>{' '}
							{formatRange(appointment.start, appointment.end)}
						</p>
						<p>
							<span className="font-medium text-gray-900">Type:</span>{' '}
							{APPOINTMENT_TYPE_LABELS[appointment.type] ?? appointment.type}
						</p>
						<p>
							<span className="font-medium text-gray-900">State:</span>{' '}
							{APPOINTMENT_STATE_LABELS[appointment.state] ?? appointment.state}
						</p>
						{canOpenProfile && (
							<p>
								<Link
									href={`/dashboard/patients/${appointment.patientId}`}
									className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
								>
									View patient profile
								</Link>
							</p>
						)}
					</div>
				)}
				<div className="mt-6 flex justify-end">
					<Button type="button" variant="outline" onClick={onClose}>
						Close
					</Button>
				</div>
			</DialogPanel>
		</Dialog>
	);
}
