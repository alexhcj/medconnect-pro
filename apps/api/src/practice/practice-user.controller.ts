import {Controller, Get} from '@nestjs/common';
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
import {PracticeUserListRdo} from './practice-user.rdo.js';
import {PracticeUserService} from './practice-user.service.js';

@ApiTags('admin')
@ApiBearerAuth('bearer')
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
			'Requires admin:users. Returns session-tenant memberships only, including for SUPER_ADMIN. id is the user id, not the membership id. Tenant comes from the session, not from the client. synthetic is always true. Passwords, MFA secrets, and session hashes are not returned.',
	})
	@ApiOkResponse({type: PracticeUserListRdo})
	list(): Promise<PracticeUserListRdo> {
		return this.practiceUsers.list();
	}
}
