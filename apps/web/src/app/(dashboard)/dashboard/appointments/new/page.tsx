'use client';

import {ReactNode, Suspense} from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {AppointmentForm} from '@/components/forms/appointment-form';
import {Button} from '@/components/ui/button';
import {canWriteAppointments} from '@/lib/auth/appointment-access';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {usePatient, usePatientSearch, useProviders} from '@/lib/hooks/use-medical';
import {useSessionStatus} from '@/lib/hooks/use-session';
import {Patient} from '@/types/medical/patient';

function FormChrome({children}: {children: ReactNode}) {
	return (
		<div>
			<Link
				href="/dashboard/appointments"
				className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
			>
				Back to appointments
			</Link>
			<div className="mt-4">{children}</div>
		</div>
	);
}

function mergePatients(pagePatients: Patient[], prefilled?: Patient) {
	if (!prefilled) {
		return pagePatients;
	}
	if (pagePatients.some((patient) => patient.id === prefilled.id)) {
		return pagePatients;
	}
	return [prefilled, ...pagePatients];
}

const NewAppointmentPage = () => {
	return (
		<Suspense
			fallback={
				<FormChrome>
					<div className="space-y-3" aria-busy="true">
						<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
						<span className="sr-only">Loading appointment form</span>
					</div>
				</FormChrome>
			}
		>
			<NewAppointmentFormPage />
		</Suspense>
	);
};

const NewAppointmentFormPage = () => {
	const searchParams = useSearchParams();
	const prefilledPatientId = searchParams.get('patientId')?.trim() ?? '';
	const {session, isLoading: isSessionLoading} = useSessionStatus();
	const mockMode = isMockMode();
	const canWrite = !isSessionLoading && canWriteAppointments(session?.permissions);
	const loadOptions = canWrite && mockMode;
	const providers = useProviders(loadOptions);
	const patients = usePatientSearch({enabled: loadOptions});
	const prefilledPatient = usePatient(loadOptions ? prefilledPatientId : '');

	if (isSessionLoading) {
		return (
			<FormChrome>
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading appointment form</span>
				</div>
			</FormChrome>
		);
	}

	if (!canWrite) {
		return (
			<FormChrome>
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">You do not have access to create appointments.</p>
				</div>
			</FormChrome>
		);
	}

	if (!mockMode) {
		return (
			<FormChrome>
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">
						Appointment scheduling is mock-only until the appointment API is available.
					</p>
				</div>
			</FormChrome>
		);
	}

	if (providers.isPending || patients.isPending || (prefilledPatientId && prefilledPatient.isPending)) {
		return (
			<FormChrome>
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading appointment options</span>
				</div>
			</FormChrome>
		);
	}

	if (providers.isError || !providers.data || patients.isError) {
		return (
			<FormChrome>
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">Unable to load appointment options.</p>
					<Button
						type="button"
						className="mt-3"
						variant="outline"
						onClick={() => {
							providers.refetch();
							patients.refetch();
						}}
					>
						Retry
					</Button>
				</div>
			</FormChrome>
		);
	}

	const pagePatients = patients.data?.pages.flatMap((page) => page.patients) ?? [];
	const patientOptions = mergePatients(
		pagePatients,
		prefilledPatient.data && !prefilledPatient.isError ? prefilledPatient.data : undefined,
	);

	return (
		<FormChrome>
			<AppointmentForm
				patients={patientOptions}
				providers={providers.data}
				prefilledPatientId={prefilledPatientId}
			/>
		</FormChrome>
	);
};

export default NewAppointmentPage;
