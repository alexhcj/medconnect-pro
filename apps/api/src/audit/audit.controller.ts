import {Controller, Get, Query} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {RequirePermissions} from '../identity/auth.decorators.js';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {AuditEventSearchResultRdo} from './audit.rdo.js';
import {auditEventListQuerySchema, type AuditEventListQuery} from './audit.schema.js';
import {AuditService} from './audit.service.js';

@ApiTags('admin')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('admin/audit-events')
export class AuditController {
	constructor(private readonly audit: AuditService) {}

	@Get()
	@RequirePermissions('admin:practice')
	@ApiOperation({
		summary: 'List audit events in the resolved practice',
		description:
			'Requires admin:practice. Newest first. Page size defaults to 50 (max 100). Tenant comes from the session, not from the client. Events store actor, tenant, action, and resource ids only — no emails, notes, or clinical text.',
	})
	@ApiOkResponse({type: AuditEventSearchResultRdo})
	list(
		@Query({schema: auditEventListQuerySchema}) query: AuditEventListQuery,
	): Promise<AuditEventSearchResultRdo> {
		return this.audit.list(query);
	}
}
