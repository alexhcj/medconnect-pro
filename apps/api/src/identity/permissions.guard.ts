import {CanActivate, ExecutionContext, Injectable, Scope} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {TenantContext} from '../tenancy/tenant-context.js';
import {IS_PUBLIC_KEY, PERMISSIONS_KEY} from './auth.decorators.js';
import {PermissionDeniedError} from './auth.errors.js';
import {roleHasPermissions, type Permission} from './permissions.js';

@Injectable({scope: Scope.REQUEST})
export class PermissionsGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly tenant: TenantContext,
	) {}

	canActivate(context: ExecutionContext): boolean {
		const required = this.reflector.getAllAndOverride<readonly Permission[] | undefined>(
			PERMISSIONS_KEY,
			[context.getHandler(), context.getClass()],
		);
		if (!required || required.length === 0) {
			return true;
		}
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isPublic) {
			return true;
		}
		const {role} = this.tenant.require();
		if (!roleHasPermissions(role, required)) {
			throw new PermissionDeniedError();
		}
		return true;
	}
}
