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
import {createAdminDataSource} from './admin-data-source.js';
import type {DataSource} from 'typeorm';

const committedSpecPath = join(dirname(fileURLToPath(import.meta.url)), '../openapi/openapi.json');

const sessionSecurity = [{cookie: []}, {bearer: []}];

function loadCommittedSpec(): OpenAPIObject {
	return JSON.parse(readFileSync(committedSpecPath, 'utf8')) as OpenAPIObject;
}

describe('OpenAPI contract', () => {
	let app: INestApplication;
	let admin: DataSource;

	beforeAll(async () => {
		admin = await createAdminDataSource();
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
		if (admin?.isInitialized) {
			await admin.destroy();
		}
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
		expect(document.components?.securitySchemes?.cookie).toMatchObject({
			type: 'apiKey',
			in: 'cookie',
			name: 'mcp_access',
		});
		expect(document.components?.schemas?.RateLimitedErrorEnvelope).toBeDefined();
		expect(document.components?.schemas?.RateLimitedDetails).toMatchObject({
			required: ['retryAfterSeconds'],
		});
		expect(document.paths?.['/health']?.get?.security).toBeUndefined();
		expect(document.paths?.['/ready']?.get?.security).toBeUndefined();
		expect(document.paths?.['/auth/login']?.post?.security).toBeUndefined();
		expect(document.paths?.['/auth/refresh']?.post?.security).toBeUndefined();
		expect(document.paths?.['/auth/mfa/verify']?.post?.security).toBeUndefined();
		expect(document.paths?.['/auth/logout']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/auth/logout-all']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/auth/session']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/auth/oauth/{provider}/start']?.get?.security).toBeUndefined();
		expect(document.paths?.['/auth/oauth/{provider}/callback']?.get?.security).toBeUndefined();
		expect(document.paths).not.toHaveProperty('/auth/oauth/fake/authorize');
		expect(document.paths?.['/patients']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}']?.patch?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}']?.delete).toBeUndefined();
		expect(document.paths?.['/appointments']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/appointments']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/appointments/{id}']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/appointments/{id}']?.patch?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/appointments/{id}']?.delete?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/providers/{id}/availability']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}/history']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}/history']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}/conditions']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}/conditions']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}/vitals']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}/vitals']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}/medications']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}/medications']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}/documents']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}/documents']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/patients/{id}/documents/{documentId}/content']?.get?.security).toEqual(
			sessionSecurity,
		);
		expect(document.paths?.['/telehealth/sessions']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/telehealth/sessions/{id}']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/telehealth/sessions/{id}/join']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/telehealth/sessions/{id}/media-token']?.post?.security).toEqual(
			sessionSecurity,
		);
		expect(document.paths?.['/telehealth/sessions/{id}/end']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/billing/invoices']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/billing/invoices']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/billing/invoices/{id}']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/billing/payments']?.post?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/billing/claims']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/admin/audit-events']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/admin/security-events']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/admin/users']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/admin/users/{id}/roles']?.patch?.security).toEqual(sessionSecurity);
		expect(document.paths?.['/dashboard/overview']?.get?.security).toEqual(sessionSecurity);
		expect(document.paths).not.toHaveProperty('/providers');
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
