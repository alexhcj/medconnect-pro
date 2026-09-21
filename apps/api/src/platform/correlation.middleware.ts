import {Injectable, type NestMiddleware} from '@nestjs/common';
import type {NextFunction, Request, Response} from 'express';
import {
	CORRELATION_ID_HEADER,
	resolveCorrelationId,
	setRequestCorrelationId,
} from './correlation.js';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction): void {
		const correlationId = resolveCorrelationId(req.header(CORRELATION_ID_HEADER));
		setRequestCorrelationId(req, correlationId);
		res.setHeader('X-Correlation-ID', correlationId);
		next();
	}
}
