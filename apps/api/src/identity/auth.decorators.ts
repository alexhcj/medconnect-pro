import {applyDecorators, SetMetadata} from '@nestjs/common';
import {ApiBearerAuth, ApiCookieAuth} from '@nestjs/swagger';
import type {Permission} from './permissions.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const PERMISSIONS_KEY = 'requiredPermissions';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const RequirePermissions = (...permissions: Permission[]) =>
	SetMetadata(PERMISSIONS_KEY, permissions);

/** OpenAPI cookie or Bearer (OR), matching AuthGuard. */
export const ApiSessionAuth = () => applyDecorators(ApiCookieAuth('cookie'), ApiBearerAuth('bearer'));
