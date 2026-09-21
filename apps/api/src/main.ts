import {Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module.js';
import {configureApp} from './platform/configure-app.js';
import type {Env} from './platform/env.schema.js';

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);
	configureApp(app);
	const config = app.get(ConfigService<Env, true>);
	const port = config.get('PORT', {infer: true});
	await app.listen(port);
	Logger.log(`Listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
