import {writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Logger} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {AppModule} from '../app.module.js';
import {configureApp} from '../platform/configure-app.js';
import {createOpenApiDocument, validateOpenApiDocument} from '../platform/openapi.js';

const openapiPath = join(dirname(fileURLToPath(import.meta.url)), '../../openapi/openapi.json');

async function generate(): Promise<void> {
	const app = await NestFactory.create(AppModule, {logger: false});
	configureApp(app);
	await app.init();
	const document = createOpenApiDocument(app);
	validateOpenApiDocument(document);
	writeFileSync(openapiPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
	await app.close();
	Logger.log(`Wrote ${openapiPath}`, 'OpenAPI');
}

void generate();
