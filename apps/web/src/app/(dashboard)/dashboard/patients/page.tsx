'use client';

import {Suspense} from 'react';
import {PatientList} from '@/components/patients/patient-list';

const PatientsPage = () => {
	return (
		<div>
			<h1 className="mb-6 text-2xl font-bold text-gray-900">Patients</h1>
			<Suspense
				fallback={
					<div className="space-y-3" aria-busy="true">
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<span className="sr-only">Loading patients</span>
					</div>
				}
			>
				<PatientList />
			</Suspense>
		</div>
	);
};

export default PatientsPage;
