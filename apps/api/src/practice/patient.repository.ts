import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Patient} from '../persistence/entities/patient.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export type PatientWriteInput = {
	firstName: string;
	lastName: string;
	practiceId?: string;
	synthetic?: boolean;
};

export type PatientUpdateInput = {
	firstName?: string;
	lastName?: string;
	practiceId?: string;
};

@Injectable()
export class PatientRepository {
	constructor(
		@InjectRepository(Patient)
		private readonly rows: Repository<Patient>,
		private readonly tenant: TenantContext,
	) {}

	async list(): Promise<Patient[]> {
		const {practiceId} = this.tenant.require();
		return this.rows.find({
			where: {practiceId},
			order: {lastName: 'ASC', firstName: 'ASC'},
		});
	}

	async getById(id: string): Promise<Patient | undefined> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows.findOne({where: {id, practiceId}});
		return row ?? undefined;
	}

	async create(input: PatientWriteInput): Promise<Patient> {
		const {practiceId} = this.tenant.require();
		this.rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = this.rows.create({
			practiceId,
			firstName: input.firstName,
			lastName: input.lastName,
			synthetic: input.synthetic ?? true,
		});
		return this.rows.save(row);
	}

	async update(id: string, input: PatientUpdateInput): Promise<Patient | undefined> {
		const {practiceId} = this.tenant.require();
		this.rejectMismatchedPracticeId(input.practiceId, practiceId);
		const row = await this.getById(id);
		if (!row) {
			return undefined;
		}
		if (input.firstName !== undefined) {
			row.firstName = input.firstName;
		}
		if (input.lastName !== undefined) {
			row.lastName = input.lastName;
		}
		return this.rows.save(row);
	}

	private rejectMismatchedPracticeId(
		clientPracticeId: string | undefined,
		scopePracticeId: string,
	): void {
		if (clientPracticeId !== undefined && clientPracticeId !== scopePracticeId) {
			throw new TenantMismatchError();
		}
	}
}
