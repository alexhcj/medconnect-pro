import {BadRequestException, HttpStatus, InternalServerErrorException} from '@nestjs/common';
import {describe, expect, it} from 'vitest';
import {InvalidCredentialsError, PermissionDeniedError} from '../identity/auth.errors.js';
import {AppointmentConflictError} from '../scheduling/appointment.errors.js';
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
