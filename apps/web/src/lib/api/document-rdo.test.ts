import {describe, expect, it} from 'vitest';
import {documentFromRdo, type PatientDocumentRdo} from '@/lib/api/document-rdo';

const rdo: PatientDocumentRdo = {
	id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
	patientId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
	name: 'Intake summary.pdf',
	contentType: 'application/pdf',
	category: 'intake',
	sizeBytes: 128,
	uploadedAt: '2025-07-15T10:40:00.000Z',
	uploadedById: '11111111-1111-4111-8111-111111111111',
	synthetic: true,
};

describe('document RDO mapper', () => {
	it('maps Nest metadata without storageKey or practiceId', () => {
		expect(documentFromRdo(rdo)).toEqual({
			id: rdo.id,
			patientId: rdo.patientId,
			name: rdo.name,
			type: 'application/pdf',
			category: 'intake',
			uploadedAt: rdo.uploadedAt,
			url: `/patients/${rdo.patientId}/documents/${rdo.id}/content`,
			synthetic: true,
		});
		expect(documentFromRdo(rdo)).not.toHaveProperty('practiceId');
		expect(documentFromRdo(rdo)).not.toHaveProperty('storageKey');
	});
});
