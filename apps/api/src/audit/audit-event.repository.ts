import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {AuditEvent} from '../persistence/entities/audit-event.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';

export type AuditEventWriteInput = {
	action: string;
	resourceType: string;
	resourceId: string | null;
	correlationId: string;
};

@Injectable()
export class AuditEventRepository {
	constructor(
		@InjectRepository(AuditEvent)
		private readonly rows: Repository<AuditEvent>,
		private readonly tenant: TenantContext,
	) {}

	async record(input: AuditEventWriteInput): Promise<AuditEvent> {
		const {practiceId, actorUserId} = this.tenant.require();
		const row = this.rows.create({
			practiceId,
			actorUserId,
			action: input.action,
			resourceType: input.resourceType,
			resourceId: input.resourceId,
			correlationId: input.correlationId,
		});
		return this.rows.save(row);
	}
}
