import {CanActivate, ExecutionContext, Injectable, Scope} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import type {Request} from 'express';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {IS_PUBLIC_KEY} from './auth.decorators.js';
import {SessionInvalidError} from './auth.errors.js';
import {AuthService} from './auth.service.js';

export type RequestAuth = {
	authSessionId?: string;
	authUserId?: string;
};

@Injectable({scope: Scope.REQUEST})
export class AuthGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly auth: AuthService,
		private readonly tenant: TenantContext,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request & RequestAuth>();
		if (this.isPublic(context) || isOpenApiPath(request.path || request.url || '')) {
			return true;
		}

		const token = readBearer(request.header('authorization'));
		if (!token) {
			throw new SessionInvalidError();
		}

		const resolved = await this.auth.authenticate(token);
		const clientPracticeIds = readClientPracticeIds(request);
		if (clientPracticeIds.some((practiceId) => practiceId !== resolved.membership.practiceId)) {
			throw new TenantMismatchError();
		}

		this.tenant.set({
			practiceId: resolved.membership.practiceId,
			actorUserId: resolved.membership.userId,
			role: resolved.membership.role,
		});
		request.authSessionId = resolved.session.id;
		request.authUserId = resolved.session.userId;
		return true;
	}

	private isPublic(context: ExecutionContext): boolean {
		return (
			this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
				context.getHandler(),
				context.getClass(),
			]) === true
		);
	}
}

function isOpenApiPath(path: string): boolean {
	const normalized = path.split('?')[0] ?? path;
	return (
		normalized === '/api/docs' ||
		normalized.startsWith('/api/docs/') ||
		normalized === '/api/docs-json'
	);
}

function readBearer(header: string | undefined): string | undefined {
	if (!header) {
		return undefined;
	}
	const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
	return match?.[1];
}

function readClientPracticeIds(request: Request): string[] {
	const ids: string[] = [];
	collectPracticeIds(request.query?.practiceId, ids);
	if (request.body && typeof request.body === 'object') {
		collectPracticeIds((request.body as {practiceId?: unknown}).practiceId, ids);
	}
	return ids;
}

function collectPracticeIds(value: unknown, into: string[]): void {
	if (typeof value === 'string' && value.length > 0) {
		into.push(value);
		return;
	}
	if (Array.isArray(value)) {
		for (const item of value) {
			collectPracticeIds(item, into);
		}
	}
}
