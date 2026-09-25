import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {
	ClinicalHistory,
	type HistoryEntryStatus,
	type HistoryEntryType,
} from '../persistence/entities/clinical-history.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export type ClinicalHistoryWriteInput = {
	patientId: string;
	type: HistoryEntryType;
	occurredAt: Date;
	title: string;
	summary: string;
	providerUserId: string;
	status: HistoryEntryStatus;
	practiceId?: string;
};

@Injectable()
export class ClinicalHistoryRepository {
	constructor(
		@InjectRepository(ClinicalHistory)
		private readonly rows: Repository<ClinicalHistory>,
		private readonly tenant: TenantContext,
	) {}

	async listByPatient(patientId: string): Promise<ClinicalHistory[]> {
		const {practiceId} = this.tenant.require();
		return this.rows.find({
			where: {practiceId, patientId},
			order: {occurredAt: 'DESC', id: 'DESC'},
		});
	}

	async create(input: ClinicalHistoryWriteInput): Promise<ClinicalHistory> {
		const {practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = this.rows.create({
			practiceId,
			patientId: input.patientId,
			type: input.type,
			occurredAt: input.occurredAt,
			title: input.title,
			summary: input.summary,
			providerUserId: input.providerUserId,
			status: input.status,
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
