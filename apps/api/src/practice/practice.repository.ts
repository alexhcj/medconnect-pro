import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Practice} from '../persistence/entities/practice.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';

@Injectable()
export class PracticeRepository {
	constructor(
		@InjectRepository(Practice)
		private readonly rows: Repository<Practice>,
		private readonly tenant: TenantContext,
	) {}

	async getCurrent(): Promise<Practice | undefined> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows.findOne({where: {id: practiceId}});
		return row ?? undefined;
	}
}
