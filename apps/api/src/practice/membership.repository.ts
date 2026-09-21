import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import type {PracticeRole} from '../tenancy/practice-role.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export type MembershipWriteInput = {
	userId: string;
	role: PracticeRole;
	practiceId?: string;
};

@Injectable()
export class MembershipRepository {
	constructor(
		@InjectRepository(PracticeMembership)
		private readonly rows: Repository<PracticeMembership>,
		private readonly tenant: TenantContext,
	) {}

	async list(): Promise<PracticeMembership[]> {
		const {practiceId} = this.tenant.require();
		return this.rows.find({
			where: {practiceId},
			order: {createdAt: 'ASC'},
		});
	}

	async getById(id: string): Promise<PracticeMembership | undefined> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows.findOne({where: {id, practiceId}});
		return row ?? undefined;
	}

	async create(input: MembershipWriteInput): Promise<PracticeMembership> {
		const {practiceId} = this.tenant.require();
		if (input.practiceId !== undefined && input.practiceId !== practiceId) {
			throw new TenantMismatchError();
		}
		const row = this.rows.create({
			practiceId,
			userId: input.userId,
			role: input.role,
		});
		return this.rows.save(row);
	}
}
