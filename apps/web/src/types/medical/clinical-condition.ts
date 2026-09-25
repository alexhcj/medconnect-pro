export type ClinicalConditionStatus = 'active' | 'resolved' | 'inactive';

export interface ClinicalCondition {
	id: string;
	patientId: string;
	display: string;
	clinicalStatus: ClinicalConditionStatus;
	recordedAt: string;
	recordedById: string;
	synthetic: boolean;
}
