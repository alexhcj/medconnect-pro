import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {INestApplication} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import type {OpenAPIObject} from '@nestjs/swagger';
import request from 'supertest';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {AppModule} from '../src/app.module.js';
import {configureApp} from '../src/platform/configure-app.js';
import {setupOpenApi, validateOpenApiDocument} from '../src/platform/openapi.js';

const committedSpecPath = join(dirname(fileURLToPath(import.meta.url)), '../openapi/openapi.json');

function loadCommittedSpec(): OpenAPIObject {
	return JSON.parse(readFileSync(committedSpecPath, 'utf8')) as OpenAPIObject;
}

describe('OpenAPI contract', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleRef.createNestApplication();
		configureApp(app);
		setupOpenApi(app);
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('GET /health matches the documented liveness schema', async () => {
		const response = await request(app.getHttpServer()).get('/health').expect(200);
		expect(response.body).toEqual({status: 'ok'});
	});

	it('GET /api/docs-json is the generated document with platform metadata', async () => {
		const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
		const document = response.body as OpenAPIObject;
		validateOpenApiDocument(document);
		expect(document.info.title).toBe('MedConnect Pro API');
		expect(document.paths?.['/health']?.get?.security).toBeUndefined();
		expect(document.paths?.['/ready']?.get?.security).toBeUndefined();
		expect(document.paths?.['/auth/login']?.post?.security).toBeUndefined();
		expect(document.paths?.['/auth/refresh']?.post?.security).toBeUndefined();
		expect(document.paths?.['/auth/mfa/verify']?.post?.security).toBeUndefined();
		expect(document.paths?.['/auth/logout']?.post?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/auth/logout-all']?.post?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients']?.get?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients']?.post?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients/{id}']?.get?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients/{id}']?.patch?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients/{id}']?.delete).toBeUndefined();
		expect(document.paths?.['/appointments']?.get?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/appointments']?.post?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/appointments/{id}']?.get?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/appointments/{id}']?.patch?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/appointments/{id}']?.delete?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/providers/{id}/availability']?.get?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients/{id}/history']?.get?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients/{id}/history']?.post?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients/{id}/conditions']?.get?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients/{id}/conditions']?.post?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients/{id}/vitals']?.get?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients/{id}/vitals']?.post?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients/{id}/medications']?.get?.security).toEqual([{bearer: []}]);
		expect(document.paths?.['/patients/{id}/medications']?.post?.security).toEqual([{bearer: []}]);
		expect(document.paths).not.toHaveProperty('/providers');
		expect(document.paths).not.toHaveProperty('/patients/{id}/documents');
		expect(document.paths).not.toHaveProperty('/__test/validate');
		expect(document.paths).not.toHaveProperty('/__test/authz');
		expect(JSON.stringify(document)).not.toMatch(/Demo-Admin-1|Demo-Mfa-1|135790/);
		expect(JSON.stringify(document)).not.toMatch(/eyJ[A-Za-z0-9_-]+\.|sk_live|BEGIN PRIVATE KEY/);
		const committed = loadCommittedSpec();
		expect(document.paths).toEqual(committed.paths);
		expect(document.components).toEqual(committed.components);
		expect(document.info.title).toBe(committed.info.title);
	});

	it('optional Swagger UI is served at /api/docs when enabled', async () => {
		const response = await request(app.getHttpServer()).get('/api/docs').expect(200);
		expect(String(response.headers['content-type'])).toMatch(/html/);
		expect(String(response.text)).toMatch(/swagger/i);
	});
});

describe('OpenAPI contract with Swagger UI disabled', () => {
	let app: INestApplication;
	const previous = process.env.SWAGGER_UI_ENABLED;

	beforeAll(async () => {
		process.env.SWAGGER_UI_ENABLED = 'false';
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleRef.createNestApplication();
		configureApp(app);
		setupOpenApi(app);
		await app.init();
	});

	afterAll(async () => {
		await app.close();
		if (previous === undefined) {
			delete process.env.SWAGGER_UI_ENABLED;
		} else {
			process.env.SWAGGER_UI_ENABLED = previous;
		}
	});

	it('still serves raw JSON and does not serve Swagger UI', async () => {
		await request(app.getHttpServer()).get('/api/docs-json').expect(200);
		const ui = await request(app.getHttpServer()).get('/api/docs');
		expect(ui.status).not.toBe(200);
		expect(String(ui.headers['content-type'] ?? '')).not.toMatch(/html/);
	});
});
