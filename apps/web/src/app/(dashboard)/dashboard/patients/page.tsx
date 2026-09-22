'use client';

import {PatientList} from '@/components/patients/patient-list';

const PatientsPage = () => {
	return (
		<div>
			<h1 className="mb-6 text-2xl font-bold text-gray-900">Patients</h1>
			<PatientList />
		</div>
	);
};

export default PatientsPage;
