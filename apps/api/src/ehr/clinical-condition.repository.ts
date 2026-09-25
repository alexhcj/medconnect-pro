import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {
	ClinicalCondition,
	type ClinicalConditionStatus,
} from '../persistence/entities/clinical-condition.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export type ClinicalConditionWriteInput = {
	patientId: string;
	display: string;
	clinicalStatus: ClinicalConditionStatus;
	recordedAt: Date;
	recordedByUserId: string;
	practiceId?: string;
};

@Injectable()
export class ClinicalConditionRepository {
	constructor(
		@InjectRepository(ClinicalCondition)
		private readonly rows: Repository<ClinicalCondition>,
		private readonly tenant: TenantContext,
	) {}

	async listByPatient(patientId: string): Promise<ClinicalCondition[]> {
		const {practiceId} = this.tenant.require();
		return this.rows.find({
			where: {practiceId, patientId},
			order: {recordedAt: 'DESC', id: 'DESC'},
		});
	}

	async create(input: ClinicalConditionWriteInput): Promise<ClinicalCondition> {
		const {practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = this.rows.create({
			practiceId,
			patientId: input.patientId,
			display: input.display,
			clinicalStatus: input.clinicalStatus,
			recordedAt: input.recordedAt,
			recordedByUserId: input.recordedByUserId,
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
