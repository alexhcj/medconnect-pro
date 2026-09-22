import {Controller, Get, NotFoundException, Param} from '@nestjs/common';
import {RequirePermissions} from '../src/identity/auth.decorators.js';
import {PatientRepository} from '../src/practice/patient.repository.js';
import {TenantContext} from '../src/tenancy/tenant-context.js';

@Controller('__test')
export class AuthorizationProbeController {
	constructor(
		private readonly tenant: TenantContext,
		private readonly patients: PatientRepository,
	) {}

	@Get('authz')
	scope(): {practiceId: string; role: string} {
		const scope = this.tenant.require();
		return {practiceId: scope.practiceId, role: scope.role};
	}

	@Get('authz/admin')
	@RequirePermissions('admin:users')
	admin(): {ok: true} {
		return {ok: true};
	}

	@Get('authz/patients/:id')
	async patient(@Param('id') id: string): Promise<{id: string}> {
		const row = await this.patients.getById(id);
		if (!row) {
			throw new NotFoundException({
				error: {
					code: 'NOT_FOUND',
					message: 'Resource not found',
				},
			});
		}
		return {id: row.id};
	}
}
