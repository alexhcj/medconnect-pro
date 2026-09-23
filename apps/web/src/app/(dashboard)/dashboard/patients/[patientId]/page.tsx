'use client';

import {useParams} from 'next/navigation';
import {PatientProfile} from '@/components/patients/patient-profile';

const PatientProfilePage = () => {
	const params = useParams<{patientId: string}>();
	const patientId = typeof params.patientId === 'string' ? params.patientId : '';

	return <PatientProfile patientId={patientId} />;
};

export default PatientProfilePage;
