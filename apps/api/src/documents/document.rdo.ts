import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {
	DOCUMENT_CATEGORIES,
	DOCUMENT_CONTENT_TYPES,
} from '../persistence/entities/patient-document.entity.js';

@ApiSchema({name: 'PatientDocument'})
export class PatientDocumentRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({format: 'uuid'})
	patientId!: string;

	@ApiProperty({example: 'Intake summary.pdf'})
	name!: string;

	@ApiProperty({enum: DOCUMENT_CONTENT_TYPES, example: 'application/pdf'})
	contentType!: (typeof DOCUMENT_CONTENT_TYPES)[number];

	@ApiProperty({enum: DOCUMENT_CATEGORIES, example: 'intake'})
	category!: (typeof DOCUMENT_CATEGORIES)[number];

	@ApiProperty({example: 128, description: 'Object size in bytes.'})
	sizeBytes!: number;

	@ApiProperty({example: '2025-07-15T10:40:00.000Z'})
	uploadedAt!: string;

	@ApiProperty({format: 'uuid'})
	uploadedById!: string;

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'PatientDocumentList'})
export class PatientDocumentListRdo {
	@ApiProperty({type: [PatientDocumentRdo]})
	documents!: PatientDocumentRdo[];
}

@ApiSchema({name: 'PatientDocumentUploadRequest'})
export class PatientDocumentUploadRequestRdo {
	@ApiProperty({type: 'string', format: 'binary', description: 'PDF, PNG, or JPEG. Max 5 MiB.'})
	file!: string;

	@ApiProperty({enum: DOCUMENT_CATEGORIES, example: 'intake'})
	category!: (typeof DOCUMENT_CATEGORIES)[number];
}
