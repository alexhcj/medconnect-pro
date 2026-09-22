import {
	Catch,
	HttpException,
	HttpStatus,
	Logger,
	type ArgumentsHost,
	type ExceptionFilter,
} from '@nestjs/common';
import type {Request, Response} from 'express';
import {
	InvalidCredentialsError,
	MembershipUnresolvedError,
	MfaInvalidError,
	PermissionDeniedError,
	SessionInvalidError,
} from '../identity/auth.errors.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';
import {getCorrelationId} from './correlation.js';
import {
	isErrorBody,
	toErrorEnvelope,
	type ErrorBody,
	type ErrorDetail,
} from './error-envelope.js';

@Catch()
export class EnvelopeExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(EnvelopeExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const http = host.switchToHttp();
		const req = http.getRequest<Request>();
		const res = http.getResponse<Response>();
		const correlationId = getCorrelationId(req);

		const {status, error} = this.normalize(exception, correlationId);
		res.setHeader('X-Correlation-ID', correlationId);
		res.status(status).json(toErrorEnvelope(correlationId, error));
	}

	private normalize(
		exception: unknown,
		correlationId: string,
	): {status: number; error: ErrorBody} {
		const domain = this.fromDomainError(exception);
		if (domain) {
			return domain;
		}

		if (exception instanceof HttpException) {
			return this.fromHttpException(exception);
		}

		this.logger.error('Unhandled exception', {correlationId});
		return {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			error: {
				code: 'INTERNAL_ERROR',
				message: 'An unexpected error occurred',
			},
		};
	}

	private fromDomainError(exception: unknown): {status: number; error: ErrorBody} | undefined {
		if (exception instanceof InvalidCredentialsError) {
			return this.authError(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'Invalid email or password');
		}
		if (exception instanceof SessionInvalidError) {
			return this.authError(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'Authentication is required');
		}
		if (exception instanceof MfaInvalidError) {
			return this.authError(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'MFA verification failed');
		}
		if (exception instanceof TenantMismatchError) {
			return this.authError(
				HttpStatus.FORBIDDEN,
				'FORBIDDEN',
				'Client-supplied practice id is not authorized',
			);
		}
		if (exception instanceof MembershipUnresolvedError) {
			return this.authError(
				HttpStatus.FORBIDDEN,
				'FORBIDDEN',
				'A practice membership could not be resolved',
			);
		}
		if (exception instanceof PermissionDeniedError) {
			return this.authError(
				HttpStatus.FORBIDDEN,
				'FORBIDDEN',
				'You do not have permission to perform this action',
			);
		}
		return undefined;
	}

	private authError(
		status: number,
		code: string,
		message: string,
	): {status: number; error: ErrorBody} {
		return {status, error: {code, message}};
	}

	private fromHttpException(exception: HttpException): {
		status: number;
		error: ErrorBody;
	} {
		const status = exception.getStatus();
		const payload = exception.getResponse();

		if (typeof payload === 'object' && payload !== null) {
			const record = payload as Record<string, unknown>;
			if (isErrorBody(record.error)) {
				return {status, error: record.error};
			}
			if (isErrorBody(payload)) {
				return {status, error: payload};
			}
		}

		const errorCode = this.readErrorCode(exception);
		return {
			status,
			error: {
				code: errorCode ?? this.fallbackCode(status),
				message: this.safeHttpMessage(status, payload, exception),
			},
		};
	}

	private readErrorCode(exception: HttpException): string | undefined {
		const withCode = exception as HttpException & {errorCode?: unknown};
		return typeof withCode.errorCode === 'string' ? withCode.errorCode : undefined;
	}

	private fallbackCode(status: number): string {
		if (status === HttpStatus.BAD_REQUEST) {
			return 'BAD_REQUEST';
		}
		if (status === HttpStatus.NOT_FOUND) {
			return 'NOT_FOUND';
		}
		if (status === HttpStatus.UNAUTHORIZED) {
			return 'UNAUTHENTICATED';
		}
		if (status === HttpStatus.FORBIDDEN) {
			return 'FORBIDDEN';
		}
		if (status >= 500) {
			return 'INTERNAL_ERROR';
		}
		return 'REQUEST_ERROR';
	}

	private safeHttpMessage(
		status: number,
		payload: string | object,
		exception: HttpException,
	): string {
		if (status >= 500) {
			return 'An unexpected error occurred';
		}
		if (typeof payload === 'string' && payload.length > 0) {
			return payload;
		}
		if (typeof payload === 'object' && payload !== null) {
			const record = payload as Record<string, unknown>;
			if (typeof record.message === 'string' && record.message.length > 0) {
				return record.message;
			}
		}
		return exception.message || 'Request failed';
	}
}

function formatIssuePath(
	path: readonly (PropertyKey | {key: PropertyKey})[] | undefined,
): string {
	if (!path) {
		return '';
	}
	return path
		.map((segment) =>
			typeof segment === 'object' && segment !== null && 'key' in segment
				? String(segment.key)
				: String(segment),
		)
		.join('.');
}

export function standardSchemaIssuesToDetails(
	issues: readonly {
		path?: readonly (PropertyKey | {key: PropertyKey})[];
		message: string;
	}[],
): ErrorDetail[] {
	return issues.map((issue) => ({
		path: formatIssuePath(issue.path),
		message: issue.message,
	}));
}
