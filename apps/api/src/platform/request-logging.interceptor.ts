import {
	Injectable,
	Logger,
	type CallHandler,
	type ExecutionContext,
	type NestInterceptor,
} from '@nestjs/common';
import type {Request, Response} from 'express';
import {tap} from 'rxjs';
import {getCorrelationId} from './correlation.js';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger('HTTP');

	intercept(context: ExecutionContext, next: CallHandler) {
		const http = context.switchToHttp();
		const req = http.getRequest<Request>();
		const res = http.getResponse<Response>();

		return next.handle().pipe(
			tap({
				next: () => {
					this.log(req, res.statusCode);
				},
				error: () => {
					this.log(req, res.statusCode);
				},
			}),
		);
	}

	private log(req: Request, status: number): void {
		this.logger.log('request', {
			method: req.method,
			path: req.path,
			status,
			correlationId: getCorrelationId(req),
		});
	}
}
