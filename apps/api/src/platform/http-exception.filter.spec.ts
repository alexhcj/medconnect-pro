import {BadRequestException, HttpStatus, InternalServerErrorException} from '@nestjs/common';
import {describe, expect, it} from 'vitest';
import {InvalidCredentialsError, PermissionDeniedError} from '../identity/auth.errors.js';
import {InvoiceAlreadyPaidError} from '../billing/billing.errors.js';
import {AppointmentConflictError} from '../scheduling/appointment.errors.js';
import {
	DailyMediaUnavailableError,
	SessionAlreadyEndedError,
	SessionNotJoinableError,
} from '../telehealth/telehealth-session.errors.js';
import {PracticeUserNotFoundError} from '../practice/practice-user.errors.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';
import {EnvelopeExceptionFilter} from './http-exception.filter.js';
import type {ErrorEnvelope} from './error-envelope.js';

function createHost(correlationId = 'corr-1') {
	let statusCode = 0;
	let body: unknown;
	const headers: Record<string, string> = {};
	const req = {correlationId};
	const res = {
		setHeader(name: string, value: string) {
			headers[name.toLowerCase()] = value;
			return res;
		},
		status(code: number) {
			statusCode = code;
			return res;
		},
		json(payload: unknown) {
			body = payload;
			return res;
		},
	};

	const host = {
		switchToHttp: () => ({
			getRequest: () => req,
			getResponse: () => res,
		}),
	};

	return {
		host: host as never,
		getResult: () => ({
			statusCode,
			body: body as ErrorEnvelope,
			headers,
		}),
	};
}

describe('EnvelopeExceptionFilter', () => {
	const filter = new EnvelopeExceptionFilter();

	it('maps a structured BadRequestException to the error envelope', () => {
		const {host, getResult} = createHost('cid-validation');
		filter.catch(
			new BadRequestException({
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [{path: 'name', message: 'Required'}],
				},
			}),
			host,
		);

		const result = getResult();
		expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
		expect(result.headers['x-correlation-id']).toBe('cid-validation');
		expect(result.body).toEqual({
			error: {
				code: 'VALIDATION_ERROR',
				message: 'Request validation failed',
				details: [{path: 'name', message: 'Required'}],
			},
			correlationId: 'cid-validation',
		});
	});

	it('does not leak unexpected error messages', () => {
		const {host, getResult} = createHost('cid-internal');
		filter.catch(new InternalServerErrorException('secret stack'), host);

		const result = getResult();
		expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
		expect(result.body.error.code).toBe('INTERNAL_ERROR');
		expect(result.body.error.message).toBe('An unexpected error occurred');
		expect(JSON.stringify(result.body)).not.toContain('secret');
	});

	it('maps credential and permission failures to safe auth envelopes', () => {
		const unauthenticated = createHost('cid-auth');
		filter.catch(new InvalidCredentialsError(), unauthenticated.host);
		expect(unauthenticated.getResult().statusCode).toBe(HttpStatus.UNAUTHORIZED);
		expect(unauthenticated.getResult().body.error).toEqual({
			code: 'UNAUTHENTICATED',
			message: 'Invalid email or password',
		});

		const forbidden = createHost('cid-forbidden');
		filter.catch(new PermissionDeniedError(), forbidden.host);
		expect(forbidden.getResult().statusCode).toBe(HttpStatus.FORBIDDEN);
		expect(forbidden.getResult().body.error.code).toBe('FORBIDDEN');

		const mismatch = createHost('cid-tenant');
		filter.catch(new TenantMismatchError(), mismatch.host);
		expect(mismatch.getResult().statusCode).toBe(HttpStatus.FORBIDDEN);
		expect(mismatch.getResult().body.error.message).toBe(
			'Client-supplied practice id is not authorized',
		);
		expect(JSON.stringify(mismatch.getResult().body)).not.toMatch(/stack|[0-9a-f]{8}-/i);
	});

	it('maps telehealth session conflicts to 409 envelopes without PHI', () => {
		const notJoinable = createHost('cid-join');
		filter.catch(new SessionNotJoinableError(), notJoinable.host);
		expect(notJoinable.getResult().statusCode).toBe(HttpStatus.CONFLICT);
		expect(notJoinable.getResult().body.error.code).toBe('SESSION_NOT_JOINABLE');

		const ended = createHost('cid-ended');
		filter.catch(new SessionAlreadyEndedError(), ended.host);
		expect(ended.getResult().statusCode).toBe(HttpStatus.CONFLICT);
		expect(ended.getResult().body.error.code).toBe('SESSION_ENDED');
		expect(JSON.stringify(ended.getResult().body)).not.toMatch(/Quinn|Avery/);
	});

	it('maps Daily media failures to a 502 envelope without token material', () => {
		const {host, getResult} = createHost('cid-media');
		filter.catch(new DailyMediaUnavailableError(), host);
		const result = getResult();
		expect(result.statusCode).toBe(HttpStatus.BAD_GATEWAY);
		expect(result.body.error).toEqual({
			code: 'MEDIA_UNAVAILABLE',
			message: 'Live media is currently unavailable.',
		});
		expect(JSON.stringify(result.body)).not.toMatch(/Bearer|eyJ|DAILY_API_KEY/);
	});

	it('maps a paid invoice conflict to a 409 envelope without card data', () => {
		const {host, getResult} = createHost('cid-paid');
		filter.catch(new InvoiceAlreadyPaidError(), host);
		const result = getResult();
		expect(result.statusCode).toBe(HttpStatus.CONFLICT);
		expect(result.body.error.code).toBe('INVOICE_ALREADY_PAID');
		expect(JSON.stringify(result.body)).not.toMatch(/cardNumber|cvv|4111/i);
	});

	it('maps unknown practice users to the same not-found envelope', () => {
		const {host, getResult} = createHost('cid-practice-user');
		filter.catch(new PracticeUserNotFoundError(), host);
		const result = getResult();
		expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
		expect(result.body.error).toEqual({
			code: 'NOT_FOUND',
			message: 'Resource not found',
		});
	});

	it('maps appointment conflicts to a 409 envelope without PHI', () => {
		const {host, getResult} = createHost('cid-conflict');
		filter.catch(new AppointmentConflictError(), host);
		const result = getResult();
		expect(result.statusCode).toBe(HttpStatus.CONFLICT);
		expect(result.body.error).toEqual({
			code: 'APPOINTMENT_CONFLICT',
			message: 'This time overlaps an existing appointment for the provider.',
			details: [
				{
					path: 'start',
					message: 'This time overlaps an existing appointment for the provider.',
				},
			],
		});
	});
});
