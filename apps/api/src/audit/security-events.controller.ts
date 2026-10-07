import {Controller, Get, Query} from '@nestjs/common';
import {
	ApiForbiddenResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ApiSessionAuth, RequirePermissions} from '../identity/auth.decorators.js';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {AuditEventSearchResultRdo} from './audit.rdo.js';
import {auditEventListQuerySchema, type AuditEventListQuery} from './audit.schema.js';
import {AuditService} from './audit.service.js';

@ApiTags('admin')
@ApiSessionAuth()
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('admin/security-events')
export class SecurityEventsController {
	constructor(private readonly audit: AuditService) {}

	@Get()
	@RequirePermissions('admin:practice')
	@ApiOperation({
		summary: 'List authentication and session-security events in the resolved practice',
		description:
			'Requires admin:practice. Newest first. Page size defaults to 50 (max 100). Tenant comes from the session, not from the client. Returns auth.* rows only (actor, tenant, action, and resource ids — no emails, passwords, MFA secrets, or session hashes). Does not replace GET /admin/audit-events.',
	})
	@ApiOkResponse({type: AuditEventSearchResultRdo})
	list(
		@Query({schema: auditEventListQuerySchema}) query: AuditEventListQuery,
	): Promise<AuditEventSearchResultRdo> {
		return this.audit.listSecurity(query);
	}
}
