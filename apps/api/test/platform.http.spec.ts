import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import request from 'supertest';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {configureApp} from '../src/platform/configure-app.js';
import {ValidationProbeController} from './validation-probe.controller.js';

describe('platform HTTP', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
			controllers: [ValidationProbeController],
		}).compile();

		app = moduleRef.createNestApplication();
		configureApp(app);
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('GET /health returns liveness without auth', async () => {
		const response = await request(app.getHttpServer()).get('/health').expect(200);
		expect(response.body).toEqual({status: 'ok'});
		expect(response.headers['x-correlation-id']).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
	});

	it('GET /ready returns readiness without auth', async () => {
		const response = await request(app.getHttpServer()).get('/ready').expect(200);
		expect(response.body).toEqual({status: 'ready'});
		expect(response.headers['x-correlation-id']).toBeTruthy();
	});

	it('echoes X-Correlation-ID when provided', async () => {
		const response = await request(app.getHttpServer())
			.get('/health')
			.set('X-Correlation-ID', 'demo-correlation-id')
			.expect(200);
		expect(response.headers['x-correlation-id']).toBe('demo-correlation-id');
	});

	it('returns the validation error envelope for invalid bodies', async () => {
		const response = await request(app.getHttpServer())
			.post('/__test/validate')
			.set('X-Correlation-ID', 'validate-1')
			.send({})
			.expect(400);

		expect(response.headers['x-correlation-id']).toBe('validate-1');
		expect(response.body.correlationId).toBe('validate-1');
		expect(response.body.error.code).toBe('VALIDATION_ERROR');
		expect(response.body.error.message).toBe('Request validation failed');
		expect(Array.isArray(response.body.error.details)).toBe(true);
		expect(response.body.error.details.length).toBeGreaterThan(0);
		expect(JSON.stringify(response.body)).not.toMatch(/stack|password|token/i);
	});
});
