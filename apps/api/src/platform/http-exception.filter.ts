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
	CsrfInvalidError,
	InvalidCredentialsError,
	MembershipUnresolvedError,
	MfaInvalidError,
	PermissionDeniedError,
	SessionInvalidError,
} from '../identity/auth.errors.js';
import {InvalidProviderAssignmentError, PatientNotFoundError} from '../patient/patient.errors.js';
import {DocumentFileInvalidError, DocumentNotFoundError} from '../documents/document.errors.js';
import {
	AppointmentConflictError,
	AppointmentNotFoundError,
	InvalidAppointmentPatientError,
	InvalidAppointmentProviderError,
	InvalidAppointmentTimeError,
} from '../scheduling/appointment.errors.js';
import {
	InvoiceAlreadyPaidError,
	InvoiceNotFoundError,
	InvalidInvoicePatientError,
} from '../billing/billing.errors.js';
import {NotificationNotFoundError} from '../notifications/notification.errors.js';
import {PracticeUserNotFoundError} from '../practice/practice-user.errors.js';
import {
	DailyMediaUnavailableError,
	InvalidTelehealthAppointmentError,
	SessionAlreadyEndedError,
	SessionNotJoinableError,
	TelehealthSessionNotFoundError,
} from '../telehealth/telehealth-session.errors.js';
import {RateLimitedError, RateLimitUnavailableError} from '../rate-limit/rate-limit.errors.js';
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
		if (exception instanceof RateLimitedError) {
			res.setHeader('Retry-After', String(exception.retryAfterSeconds));
		}
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

		this.logger.error('Unhandled exception', {correlationId});		return {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			error: {
				code: 'INTERNAL_ERROR',
				message: 'An unexpected error occurred',
			},
		};
	}

	private fromDomainError(exception: unknown): {status: number; error: ErrorBody} | undefined {
		if (exception instanceof RateLimitedError) {
			return {
				status: HttpStatus.TOO_MANY_REQUESTS,
				error: {
					code: 'RATE_LIMITED',
					message: 'Too many requests. Try again later.',
					details: {retryAfterSeconds: exception.retryAfterSeconds},
				},
			};
		}
		if (exception instanceof RateLimitUnavailableError) {
			return {
				status: HttpStatus.SERVICE_UNAVAILABLE,
				error: {
					code: 'RATE_LIMIT_UNAVAILABLE',
					message: 'Service temporarily unavailable. Try again later.',
				},
			};
		}
		if (exception instanceof InvalidCredentialsError) {
			return this.authError(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'Invalid email or password');
		}
		if (exception instanceof SessionInvalidError) {
			return this.authError(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'Authentication is required');
		}
		if (exception instanceof CsrfInvalidError) {
			return this.authError(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'CSRF validation failed');
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
		if (
			exception instanceof PatientNotFoundError ||
			exception instanceof AppointmentNotFoundError ||
			exception instanceof TelehealthSessionNotFoundError ||
			exception instanceof InvoiceNotFoundError ||
			exception instanceof DocumentNotFoundError ||
			exception instanceof NotificationNotFoundError ||
			exception instanceof PracticeUserNotFoundError
		) {
			return this.authError(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'Resource not found');
		}
		if (exception instanceof AppointmentConflictError) {
			return {
				status: HttpStatus.CONFLICT,
				error: {
					code: 'APPOINTMENT_CONFLICT',
					message: 'This time overlaps an existing appointment for the provider.',
					details: [
						{
							path: 'start',
							message: 'This time overlaps an existing appointment for the provider.',
						},
					],
				},
			};
		}
		if (exception instanceof InvalidAppointmentTimeError) {
			return {
				status: HttpStatus.BAD_REQUEST,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [{path: 'end', message: 'End must be after start'}],
				},
			};
		}
		if (exception instanceof InvalidAppointmentPatientError) {
			return {
				status: HttpStatus.BAD_REQUEST,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [{path: 'patientId', message: 'Patient must be in this practice'}],
				},
			};
		}
		if (exception instanceof InvalidAppointmentProviderError) {
			return {
				status: HttpStatus.BAD_REQUEST,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [
						{
							path: 'providerId',
							message: 'Provider must be a provider in this practice',
						},
					],
				},
			};
		}
		if (exception instanceof InvalidTelehealthAppointmentError) {
			return {
				status: HttpStatus.BAD_REQUEST,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [
						{
							path: 'appointmentId',
							message: 'Appointment is not eligible for a telehealth session',
						},
					],
				},
			};
		}
		if (exception instanceof SessionNotJoinableError) {
			return {
				status: HttpStatus.CONFLICT,
				error: {
					code: 'SESSION_NOT_JOINABLE',
					message: 'This telehealth session cannot be joined.',
				},
			};
		}
		if (exception instanceof SessionAlreadyEndedError) {
			return {
				status: HttpStatus.CONFLICT,
				error: {
					code: 'SESSION_ENDED',
					message: 'A telehealth session for this appointment has already ended.',
				},
			};
		}
		if (exception instanceof DailyMediaUnavailableError) {
			return {
				status: HttpStatus.BAD_GATEWAY,
				error: {
					code: 'MEDIA_UNAVAILABLE',
					message: 'Live media is currently unavailable.',
				},
			};
		}
		if (exception instanceof InvoiceAlreadyPaidError) {
			return {
				status: HttpStatus.CONFLICT,
				error: {
					code: 'INVOICE_ALREADY_PAID',
					message: 'This invoice has already been paid.',
				},
			};
		}
		if (exception instanceof InvalidInvoicePatientError) {
			return {
				status: HttpStatus.BAD_REQUEST,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [{path: 'patientId', message: 'Patient must be in this practice'}],
				},
			};
		}
		if (exception instanceof DocumentFileInvalidError) {
			return {
				status: HttpStatus.BAD_REQUEST,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [{path: exception.path, message: exception.message}],
				},
			};
		}
		if (isMulterFileTooLarge(exception)) {
			return {
				status: HttpStatus.BAD_REQUEST,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [{path: 'file', message: 'File must be 5 MiB or smaller'}],
				},
			};
		}
		if (exception instanceof InvalidProviderAssignmentError) {
			return {
				status: HttpStatus.BAD_REQUEST,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [
						{
							path: 'providerId',
							message: 'Assigned provider must be a provider in this practice',
						},
					],
				},
			};
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

		if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
			return {
				status: HttpStatus.BAD_REQUEST,
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [{path: 'file', message: 'File must be 5 MiB or smaller'}],
				},
			};
		}

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

function isMulterFileTooLarge(exception: unknown): boolean {
	if (!exception || typeof exception !== 'object') {
		return false;
	}
	const record = exception as {name?: unknown; code?: unknown};
	return record.name === 'MulterError' && record.code === 'LIMIT_FILE_SIZE';
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
