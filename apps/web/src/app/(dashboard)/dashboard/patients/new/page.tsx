'use client';

import {ReactNode} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {PatientForm} from '@/components/forms/patient-form';
import {canWritePatientDemographics} from '@/lib/auth/patient-profile-access';
import {useProviders} from '@/lib/hooks/use-medical';
import {useSessionStatus} from '@/lib/hooks/use-session';

function FormChrome({children}: {children: ReactNode}) {
	return (
		<div>
			<Link
				href="/dashboard/patients"
				className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
			>
				Back to patients
			</Link>
			<div className="mt-4">{children}</div>
		</div>
	);
}

const NewPatientPage = () => {
	const {session, isLoading: isSessionLoading} = useSessionStatus();
	const canWrite = !isSessionLoading && canWritePatientDemographics(session?.permissions);
	const providers = useProviders(canWrite);

	if (isSessionLoading) {
		return (
			<FormChrome>
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading patient form</span>
				</div>
			</FormChrome>
		);
	}

	if (!canWrite) {
		return (
			<FormChrome>
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">You do not have access to create or edit patients.</p>
				</div>
			</FormChrome>
		);
	}

	if (providers.isPending) {
		return (
			<FormChrome>
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading providers</span>
				</div>
			</FormChrome>
		);
	}

	if (providers.isError || !providers.data) {
		return (
			<FormChrome>
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">Unable to load providers.</p>
					<Button type="button" className="mt-3" variant="outline" onClick={() => providers.refetch()}>
						Retry
					</Button>
				</div>
			</FormChrome>
		);
	}

	return (
		<FormChrome>
			<PatientForm mode="create" providers={providers.data} />
		</FormChrome>
	);
};

export default NewPatientPage;
