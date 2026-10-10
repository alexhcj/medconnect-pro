import {Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter} from '@nestjs/common';
import type {Response} from 'express';
import {RateLimitedError, RateLimitUnavailableError} from '../rate-limit/rate-limit.errors.js';

/** Browser callback: throttling lands on the generic login failure page, never JSON. */
@Catch(RateLimitedError, RateLimitUnavailableError)
export class OAuthCallbackRateLimitFilter implements ExceptionFilter {
	constructor(private readonly failureUrl: () => string) {}

	catch(error: RateLimitedError | RateLimitUnavailableError, host: ArgumentsHost): void {
		const response = host.switchToHttp().getResponse<Response>();
		if (error instanceof RateLimitedError) {
			response.setHeader('Retry-After', String(error.retryAfterSeconds));
		}
		response.redirect(HttpStatus.FOUND, this.failureUrl());
	}
}
