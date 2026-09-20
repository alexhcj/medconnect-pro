export type MedicationStatus = 'active' | 'discontinued' | 'completed';

export interface Medication {
	id: string;
	patientId: string;
	name: string;
	dosage: string;
	frequency: string;
	route: string;
	startDate: string;
	endDate?: string;
	prescriberId: string;
	instructions: string;
	status: MedicationStatus;
	synthetic: boolean;
}
