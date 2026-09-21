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
				bearerFormat: 'JWT',
				description:
					'OAuth 2.0 access token (Authorization: Bearer). Platform health and readiness do not require a token. Never commit tokens.',
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
	const bearer = document.components?.securitySchemes?.bearer;
	if (!bearer || (bearer as {type?: string}).type !== 'http') {
		throw new Error('OpenAPI must document HTTP Bearer security');
	}
	if (!document.components?.schemas?.ErrorEnvelope) {
		throw new Error('OpenAPI must include the ErrorEnvelope schema');
	}
}
