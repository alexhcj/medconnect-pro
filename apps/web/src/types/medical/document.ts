export interface PatientDocument {
	id: string;
	patientId: string;
	name: string;
	type: string;
	category: string;
	uploadedAt: string;
	url: string;
	synthetic: boolean;
}
