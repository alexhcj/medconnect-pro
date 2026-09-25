import {
	Injectable,
	Scope,
	type CallHandler,
	type ExecutionContext,
	type NestInterceptor,
} from '@nestjs/common';
import type {Request} from 'express';
import type {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import {AuditEventRepository} from './audit-event.repository.js';

@Injectable({scope: Scope.REQUEST})
export class AuditAccessDeniedInterceptor implements NestInterceptor {
	constructor(private readonly audit: AuditEventRepository) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest<Request>();
		return next.handle().pipe(
			tap({
				error: (error: unknown) => {
					try {
						if (error instanceof PermissionDeniedError) {
							void this.audit.tryRecordDenied(request);
						}
					} catch {
						return;
					}
				},
			}),
		);
	}
}
