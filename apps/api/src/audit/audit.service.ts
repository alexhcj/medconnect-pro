import {Injectable} from '@nestjs/common';
import type {AuditEvent} from '../persistence/entities/audit-event.entity.js';
import {
	AuditEventRepository,
	type AuditEventSearchQuery,
} from './audit-event.repository.js';
import type {AuditEventRdo, AuditEventSearchResultRdo} from './audit.rdo.js';
import type {AuditEventListQuery} from './audit.schema.js';

@Injectable()
export class AuditService {
	constructor(private readonly events: AuditEventRepository) {}

	async list(query: AuditEventListQuery): Promise<AuditEventSearchResultRdo> {
		const page = await this.events.list(toSearchQuery(query));
		return {
			events: page.events.map(toAuditEventRdo),
			nextPage: page.nextPage,
			hasMore: page.hasMore,
		};
	}
}

function toSearchQuery(query: AuditEventListQuery): AuditEventSearchQuery {
	return {
		action: query.action,
		resourceType: query.resourceType,
		from: query.from ? new Date(query.from) : undefined,
		to: query.to ? new Date(query.to) : undefined,
		page: query.page,
		pageSize: query.pageSize,
	};
}

export function toAuditEventRdo(row: AuditEvent): AuditEventRdo {
	return {
		id: row.id,
		practiceId: row.practiceId,
		actorUserId: row.actorUserId,
		action: row.action,
		resourceType: row.resourceType,
		resourceId: row.resourceId,
		correlationId: row.correlationId,
		createdAt: row.createdAt.toISOString(),
	};
}
