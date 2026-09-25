import {Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import type {Request} from 'express';
import {Repository} from 'typeorm';
import {AuditEvent} from '../persistence/entities/audit-event.entity.js';
import {getCorrelationId} from '../platform/correlation.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {resourceTypeFromPath} from './audit-access.js';

export const DEFAULT_AUDIT_PAGE_SIZE = 50;
export const MAX_AUDIT_PAGE_SIZE = 100;

export type AuditEventWriteInput = {
	action: string;
	resourceType: string;
	resourceId: string | null;
	correlationId: string;
};

export type AuditEventActorScope = {
	practiceId: string;
	actorUserId: string;
};

export type AuditEventSearchQuery = {
	action?: string;
	resourceType?: string;
	from?: Date;
	to?: Date;
	page?: number;
	pageSize?: number;
};

export type AuditEventPage = {
	events: AuditEvent[];
	nextPage?: number;
	hasMore: boolean;
};

@Injectable()
export class AuditEventRepository {
	private readonly logger = new Logger(AuditEventRepository.name);

	constructor(
		@InjectRepository(AuditEvent)
		private readonly rows: Repository<AuditEvent>,
		private readonly tenant: TenantContext,
	) {}

	async record(input: AuditEventWriteInput, scope?: AuditEventActorScope): Promise<AuditEvent> {
		const {practiceId, actorUserId} = scope ?? this.tenant.require();
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

	async list(query: AuditEventSearchQuery): Promise<AuditEventPage> {
		const {practiceId} = this.tenant.require();
		const page = query.page ?? 1;
		const pageSize = clampPageSize(query.pageSize);
		const qb = this.rows
			.createQueryBuilder('event')
			.where('event.practiceId = :practiceId', {practiceId});

		if (query.action) {
			qb.andWhere('event.action = :action', {action: query.action});
		}
		if (query.resourceType) {
			qb.andWhere('event.resourceType = :resourceType', {resourceType: query.resourceType});
		}
		if (query.from) {
			qb.andWhere('event.createdAt >= :from', {from: query.from});
		}
		if (query.to) {
			qb.andWhere('event.createdAt <= :to', {to: query.to});
		}

		qb.orderBy('event.createdAt', 'DESC').addOrderBy('event.id', 'DESC');
		qb.skip((page - 1) * pageSize).take(pageSize);

		const [events, total] = await qb.getManyAndCount();
		const hasMore = page * pageSize < total;
		return {
			events,
			hasMore,
			nextPage: hasMore ? page + 1 : undefined,
		};
	}

	async tryRecordDenied(request: Request, scope?: AuditEventActorScope): Promise<void> {
		const resolved = scope ?? this.tenant.current();
		if (!resolved) {
			return;
		}
		try {
			await this.record(
				{
					action: 'access.denied',
					resourceType: resourceTypeFromPath(request.path || request.url || ''),
					resourceId: null,
					correlationId: getCorrelationId(request),
				},
				resolved,
			);
		} catch (error) {
			this.logger.warn('Failed to record access.denied audit event');
			void error;
		}
	}
}

function clampPageSize(pageSize: number | undefined): number {
	if (pageSize === undefined) {
		return DEFAULT_AUDIT_PAGE_SIZE;
	}
	return Math.min(Math.max(pageSize, 1), MAX_AUDIT_PAGE_SIZE);
}
