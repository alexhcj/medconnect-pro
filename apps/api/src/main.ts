import {Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module.js';
import {configureApp} from './platform/configure-app.js';
import type {Env} from './platform/env.schema.js';
import {resolveSwaggerUiEnabled, setupOpenApi} from './platform/openapi.js';

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);
	configureApp(app);
	setupOpenApi(app);
	const config = app.get(ConfigService<Env, true>);
	const port = config.get('PORT', {infer: true});
	await app.listen(port);
	Logger.log(`Listening on http://localhost:${port}`, 'Bootstrap');
	if (resolveSwaggerUiEnabled(config)) {
		Logger.log(`Swagger UI http://localhost:${port}/api/docs`, 'Bootstrap');
	}
	Logger.log(`OpenAPI JSON http://localhost:${port}/api/docs-json`, 'Bootstrap');
}

void bootstrap();
