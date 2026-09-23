import type {Patient, PatientStatus} from '@/types/medical/patient';

/** Demographics returned by Nest `PatientRdo`. Clinical fields are not part of this contract. */
export interface PatientRdo {
	id: string;
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	gender: string;
	status: PatientStatus;
	phone: string;
	email: string;
	address: Patient['address'];
	emergencyContact: Patient['emergencyContact'];
	insurance: Patient['insurance'];
	providerId: string;
	practiceId: string;
	synthetic: boolean;
}

export interface PatientSearchResultRdo {
	patients: PatientRdo[];
	nextPage?: number;
	hasMore: boolean;
}

export function patientFromRdo(rdo: PatientRdo): Patient {
	return {
		id: rdo.id,
		firstName: rdo.firstName,
		lastName: rdo.lastName,
		dateOfBirth: rdo.dateOfBirth,
		gender: rdo.gender,
		status: rdo.status,
		phone: rdo.phone,
		email: rdo.email,
		address: rdo.address,
		emergencyContact: rdo.emergencyContact,
		insurance: rdo.insurance,
		providerId: rdo.providerId,
		practiceId: rdo.practiceId,
		synthetic: rdo.synthetic,
		conditions: [],
	};
}
