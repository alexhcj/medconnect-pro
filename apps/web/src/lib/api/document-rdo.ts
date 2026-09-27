import type {PatientDocument} from '@/types/medical/document';

/** Metadata row returned by Nest `PatientDocumentRdo`. Storage keys are not included. */
export interface PatientDocumentRdo {
	id: string;
	patientId: string;
	name: string;
	contentType: string;
	category: string;
	sizeBytes: number;
	uploadedAt: string;
	uploadedById: string;
	synthetic: boolean;
}

export interface PatientDocumentListRdo {
	documents: PatientDocumentRdo[];
}

export function documentFromRdo(rdo: PatientDocumentRdo): PatientDocument {
	return {
		id: rdo.id,
		patientId: rdo.patientId,
		name: rdo.name,
		type: rdo.contentType,
		category: rdo.category,
		uploadedAt: rdo.uploadedAt,
		url: `/patients/${rdo.patientId}/documents/${rdo.id}/content`,
		synthetic: rdo.synthetic,
	};
}
