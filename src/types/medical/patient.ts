export interface PatientAddress {
	street: string;
	city: string;
	state: string;
	postalCode: string;
}

export interface EmergencyContact {
	name: string;
	relationship: string;
	phone: string;
}

export interface Insurance {
	provider: string;
	policyNumber: string;
	groupNumber: string;
}

export type PatientStatus = 'active' | 'inactive';

export interface Patient {
	id: string;
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	gender: string;
	status: PatientStatus;
	phone: string;
	email: string;
	address: PatientAddress;
	emergencyContact: EmergencyContact;
	insurance: Insurance;
	practiceId: string;
	providerId: string;
	conditions: string[];
	synthetic: boolean;
}
