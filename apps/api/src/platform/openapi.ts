import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {type INestApplication} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {DocumentBuilder, SwaggerModule, type OpenAPIObject} from '@nestjs/swagger';
import {ErrorBodyRdo, ErrorDetailRdo, ErrorEnvelopeRdo} from './error-envelope.rdo.js';
import type {Env} from './env.schema.js';

const LOCAL_SERVER = 'http://localhost:3001';

function readApiPackageVersion(): string {
	const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {version: string};
	return pkg.version;
}

export function coerceEnvBoolean(value: unknown): boolean | undefined {
	if (value === undefined || value === '') {
		return undefined;
	}
	if (value === true || value === 'true' || value === '1') {
		return true;
	}
	if (value === false || value === 'false' || value === '0') {
		return false;
	}
	return undefined;
}

export function resolveSwaggerUiEnabled(config: ConfigService<Env, true>): boolean {
	const explicit = coerceEnvBoolean(config.get('SWAGGER_UI_ENABLED', {infer: true}));
	if (explicit !== undefined) {
		return explicit;
	}
	return config.get('NODE_ENV', {infer: true}) !== 'production';
}

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
	const config = new DocumentBuilder()
		.setTitle('MedConnect Pro API')
		.setDescription(
			'Generated OpenAPI contract for the MedConnect Pro demonstration API. This is not a HIPAA-certified production system. Examples and fixtures must be synthetic demo data only. Do not put secrets, tokens, or real patient information in this document.',
		)
		.setVersion(readApiPackageVersion())
		.addServer(LOCAL_SERVER, 'Local development')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'Opaque',
				description:
					'Opaque mock access token (Authorization: Bearer). Stand-in for a future OAuth 2.0 access token, not a production IdP credential. Platform health and readiness do not require a token. Never commit tokens.',
			},
			'bearer',
		)
		.build();

	return SwaggerModule.createDocument(app, config, {
		extraModels: [ErrorEnvelopeRdo, ErrorBodyRdo, ErrorDetailRdo],
		operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`,
	});
}

export function setupOpenApi(app: INestApplication): OpenAPIObject {
	const config = app.get(ConfigService<Env, true>);
	const document = createOpenApiDocument(app);
	validateOpenApiDocument(document);
	SwaggerModule.setup('api/docs', app, document, {
		useGlobalPrefix: false,
		swaggerUiEnabled: resolveSwaggerUiEnabled(config),
		jsonDocumentUrl: 'api/docs-json',
		customSiteTitle: 'MedConnect Pro API',
	});
	return document;
}

export function validateOpenApiDocument(document: OpenAPIObject): void {
	if (!document.openapi?.startsWith('3.')) {
		throw new Error('OpenAPI document must be OpenAPI 3.x');
	}
	if (!document.info?.title || !document.info.description || !document.info.version) {
		throw new Error('OpenAPI info must include title, description, and version');
	}
	if (!document.servers?.some((server) => server.url === LOCAL_SERVER)) {
		throw new Error(`OpenAPI servers must include ${LOCAL_SERVER}`);
	}
	if (!document.paths?.['/health'] || !document.paths?.['/ready']) {
		throw new Error('OpenAPI must include /health and /ready');
	}
	const bearer = document.components?.securitySchemes?.bearer as
		| {type?: string; bearerFormat?: string}
		| undefined;
	if (!bearer || bearer.type !== 'http' || bearer.bearerFormat === 'JWT') {
		throw new Error('OpenAPI must document opaque HTTP Bearer security');
	}
	assertUnauthenticated(document, '/health', 'get');
	assertUnauthenticated(document, '/ready', 'get');
	assertUnauthenticated(document, '/auth/login', 'post');
	assertUnauthenticated(document, '/auth/refresh', 'post');
	assertUnauthenticated(document, '/auth/mfa/verify', 'post');
	assertBearer(document, '/auth/logout', 'post');
	assertBearer(document, '/auth/logout-all', 'post');
	assertBearer(document, '/patients', 'get');
	assertBearer(document, '/patients', 'post');
	assertBearer(document, '/patients/{id}', 'get');
	assertBearer(document, '/patients/{id}', 'patch');
	assertBearer(document, '/appointments', 'get');
	assertBearer(document, '/appointments', 'post');
	assertBearer(document, '/appointments/{id}', 'get');
	assertBearer(document, '/appointments/{id}', 'patch');
	assertBearer(document, '/appointments/{id}', 'delete');
	assertBearer(document, '/providers/{id}/availability', 'get');
	assertBearer(document, '/patients/{id}/history', 'get');
	assertBearer(document, '/patients/{id}/history', 'post');
	assertBearer(document, '/patients/{id}/conditions', 'get');
	assertBearer(document, '/patients/{id}/conditions', 'post');
	assertBearer(document, '/patients/{id}/vitals', 'get');
	assertBearer(document, '/patients/{id}/vitals', 'post');
	assertBearer(document, '/patients/{id}/medications', 'get');
	assertBearer(document, '/patients/{id}/medications', 'post');
	const patientById = document.paths?.['/patients/{id}'];
	if (patientById && 'delete' in patientById) {
		throw new Error('DELETE /patients/{id} is not part of the patient contract');
	}
	if (document.paths?.['/patients/{id}/documents']) {
		throw new Error('/patients/{id}/documents is outside the clinical record contract');
	}
	if (!document.components?.schemas?.ErrorEnvelope) {
		throw new Error('OpenAPI must include the ErrorEnvelope schema');
	}
}

type DocumentedOperation = {
	security?: Array<Record<string, unknown>>;
};

function documentedOperation(
	document: OpenAPIObject,
	path: string,
	method: string,
): DocumentedOperation | undefined {
	const item = document.paths?.[path] as Record<string, DocumentedOperation> | undefined;
	return item?.[method];
}

function assertUnauthenticated(document: OpenAPIObject, path: string, method: string): void {
	const operation = documentedOperation(document, path, method);
	if (!operation) {
		throw new Error(`OpenAPI must include ${method.toUpperCase()} ${path}`);
	}
	if (operation.security && operation.security.length > 0) {
		throw new Error(`${method.toUpperCase()} ${path} must not require authentication`);
	}
}

function assertBearer(document: OpenAPIObject, path: string, method: string): void {
	const operation = documentedOperation(document, path, method);
	const hasBearer = operation?.security?.some((requirement) =>
		Object.prototype.hasOwnProperty.call(requirement, 'bearer'),
	);
	if (!hasBearer) {
		throw new Error(`${method.toUpperCase()} ${path} must require HTTP Bearer auth`);
	}
}
