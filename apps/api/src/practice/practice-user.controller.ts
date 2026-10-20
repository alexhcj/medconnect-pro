import {Body, Controller, Get, Param, Patch, Query} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ApiSessionAuth, RequirePermissions} from '../identity/auth.decorators.js';
import {ErrorEnvelopeRdo} from '../platform/error-envelope.rdo.js';
import {
	PracticeUserListRdo,
	PracticeUserRdo,
	PracticeUserRoleUpdateRequestRdo,
} from './practice-user.rdo.js';
import {
	practiceUserIdParamsSchema,
	practiceUserListQuerySchema,
	practiceUserRoleUpdateSchema,
	type PracticeUserIdParams,
	type PracticeUserListQuery,
	type PracticeUserRoleUpdateBody,
} from './practice-user.schema.js';
import {PracticeUserService} from './practice-user.service.js';

@ApiTags('admin')
@ApiSessionAuth()
@ApiUnauthorizedResponse({type: ErrorEnvelopeRdo})
@ApiForbiddenResponse({type: ErrorEnvelopeRdo})
@Controller('admin/users')
export class PracticeUserController {
	constructor(private readonly practiceUsers: PracticeUserService) {}

	@Get()
	@RequirePermissions('admin:users')
	@ApiOperation({
		summary: 'List practice memberships in the resolved practice',
		description:
			'Requires admin:users. Returns session-tenant memberships only, including for SUPER_ADMIN. id is the user id, not the membership id. Tenant comes from the session, not from the client. synthetic is always true. Passwords, MFA secrets, and session hashes are not returned. Paged: page (default 1), pageSize (default 25, max 100), optional q (email substring) and role. Ordered by membership creation then id. total counts only session-practice rows matching the filters; invalid values return 400.',
	})
	@ApiOkResponse({type: PracticeUserListRdo})
	@ApiBadRequestResponse({type: ErrorEnvelopeRdo})
	list(
		@Query({schema: practiceUserListQuerySchema}) query: PracticeUserListQuery,
	): Promise<PracticeUserListRdo> {
		return this.practiceUsers.list(query);
	}

	@Patch(':id/roles')
	@RequirePermissions('admin:users')
	@ApiOperation({
		summary: 'Assign a membership role in the resolved practice',
		description:
			'Requires admin:users. Updates the session-practice membership for the user id. PRACTICE_ADMIN cannot grant SUPER_ADMIN. The last PRACTICE_ADMIN of the practice cannot be removed. SUPER_ADMIN is session-tenant scoped. Unknown and cross-tenant ids return the same not-found response. Tenant comes from the session, not from the client. Passwords, MFA secrets, and session hashes are not returned.',
	})
	@ApiBody({type: PracticeUserRoleUpdateRequestRdo})
	@ApiOkResponse({type: PracticeUserRdo})
	@ApiNotFoundResponse({type: ErrorEnvelopeRdo})
	assignRole(
		@Param({schema: practiceUserIdParamsSchema}) params: PracticeUserIdParams,
		@Body({schema: practiceUserRoleUpdateSchema}) body: PracticeUserRoleUpdateBody,
	): Promise<PracticeUserRdo> {
		return this.practiceUsers.assignRole(params.id, body.role);
	}
}
