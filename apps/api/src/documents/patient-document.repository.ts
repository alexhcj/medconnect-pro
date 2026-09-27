import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {
	PatientDocument,
	type DocumentCategory,
	type DocumentContentType,
} from '../persistence/entities/patient-document.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export type PatientDocumentWriteInput = {
	id: string;
	patientId: string;
	name: string;
	contentType: DocumentContentType;
	category: DocumentCategory;
	sizeBytes: number;
	storageKey: string;
	uploadedByUserId: string;
	practiceId?: string;
};

@Injectable()
export class PatientDocumentRepository {
	constructor(
		@InjectRepository(PatientDocument)
		private readonly rows: Repository<PatientDocument>,
		private readonly tenant: TenantContext,
	) {}

	async listByPatient(patientId: string): Promise<PatientDocument[]> {
		const {practiceId} = this.tenant.require();
		return this.rows.find({
			where: {practiceId, patientId},
			order: {createdAt: 'DESC', id: 'DESC'},
		});
	}

	async getById(patientId: string, documentId: string): Promise<PatientDocument | null> {
		const {practiceId} = this.tenant.require();
		return this.rows.findOne({where: {id: documentId, patientId, practiceId}});
	}

	async create(input: PatientDocumentWriteInput): Promise<PatientDocument> {
		const {practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = this.rows.create({
			id: input.id,
			practiceId,
			patientId: input.patientId,
			name: input.name,
			contentType: input.contentType,
			category: input.category,
			sizeBytes: input.sizeBytes,
			storageKey: input.storageKey,
			uploadedByUserId: input.uploadedByUserId,
			synthetic: true,
		});
		return this.rows.save(row);
	}
}

function rejectMismatchedPracticeId(
	clientPracticeId: string | undefined,
	scopePracticeId: string,
): void {
	if (clientPracticeId !== undefined && clientPracticeId !== scopePracticeId) {
		throw new TenantMismatchError();
	}
}
