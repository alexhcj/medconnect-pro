import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Vital} from '../persistence/entities/vital.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export type VitalWriteInput = {
	patientId: string;
	recordedAt: Date;
	systolicMmHg: number;
	diastolicMmHg: number;
	heartRateBpm: number;
	temperatureC: number;
	respiratoryRate: number;
	spo2Percent: number;
	weightKg: number;
	recordedByUserId: string;
	practiceId?: string;
};

@Injectable()
export class VitalRepository {
	constructor(
		@InjectRepository(Vital)
		private readonly rows: Repository<Vital>,
		private readonly tenant: TenantContext,
	) {}

	async listByPatient(patientId: string): Promise<Vital[]> {
		const {practiceId} = this.tenant.require();
		return this.rows.find({
			where: {practiceId, patientId},
			order: {recordedAt: 'DESC', id: 'DESC'},
		});
	}

	async create(input: VitalWriteInput): Promise<Vital> {
		const {practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = this.rows.create({
			practiceId,
			patientId: input.patientId,
			recordedAt: input.recordedAt,
			systolicMmHg: input.systolicMmHg,
			diastolicMmHg: input.diastolicMmHg,
			heartRateBpm: input.heartRateBpm,
			temperatureC: input.temperatureC,
			respiratoryRate: input.respiratoryRate,
			spo2Percent: input.spo2Percent,
			weightKg: input.weightKg,
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
