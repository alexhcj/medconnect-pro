import {Injectable, type CallHandler, type ExecutionContext, type NestInterceptor} from '@nestjs/common';
import {from, lastValueFrom, type Observable} from 'rxjs';
import {tenantAls} from './tenant-als.js';

export type RequestTenantScope = {
	tenantPracticeId?: string;
};

@Injectable()
export class TenantRlsInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const practiceId = context.switchToHttp().getRequest<RequestTenantScope>().tenantPracticeId;
		if (!practiceId) {
			return next.handle();
		}
		return from(
			tenantAls.run({practiceId}, () => lastValueFrom(next.handle(), {defaultValue: undefined})),
		);
	}
}
