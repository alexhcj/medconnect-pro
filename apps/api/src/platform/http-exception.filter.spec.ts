import {BadRequestException, HttpStatus, InternalServerErrorException} from '@nestjs/common';
import {describe, expect, it} from 'vitest';
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
});
