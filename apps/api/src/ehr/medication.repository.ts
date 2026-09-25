import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Medication, type MedicationStatus} from '../persistence/entities/medication.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export type MedicationWriteInput = {
	patientId: string;
	name: string;
	dosage: string;
	frequency: string;
	route: string;
	startDate: string;
	endDate?: string | null;
	prescriberUserId: string;
	instructions: string;
	status: MedicationStatus;
	practiceId?: string;
};

@Injectable()
export class MedicationRepository {
	constructor(
		@InjectRepository(Medication)
		private readonly rows: Repository<Medication>,
		private readonly tenant: TenantContext,
	) {}

	async listByPatient(patientId: string): Promise<Medication[]> {
		const {practiceId} = this.tenant.require();
		return this.rows.find({
			where: {practiceId, patientId},
			order: {startDate: 'DESC', id: 'DESC'},
		});
	}

	async create(input: MedicationWriteInput): Promise<Medication> {
		const {practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = this.rows.create({
			practiceId,
			patientId: input.patientId,
			name: input.name,
			dosage: input.dosage,
			frequency: input.frequency,
			route: input.route,
			startDate: input.startDate,
			endDate: input.endDate ?? null,
			prescriberUserId: input.prescriberUserId,
			instructions: input.instructions,
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
