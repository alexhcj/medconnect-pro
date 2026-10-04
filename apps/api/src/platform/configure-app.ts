import {
	BadRequestException,
	StandardSchemaValidationPipe,
	type INestApplication,
} from '@nestjs/common';
import {isCorsOriginAllowed, resolveCorsOriginPolicy} from './cors-origins.js';
import {EnvelopeExceptionFilter, standardSchemaIssuesToDetails} from './http-exception.filter.js';
import {RequestLoggingInterceptor} from './request-logging.interceptor.js';

function resolveAppEnv(): 'local' | 'preview' | 'production' {
	if (process.env.APP_ENV === 'preview' || process.env.APP_ENV === 'production') {
		return process.env.APP_ENV;
	}
	return 'local';
}

export function configureApp(app: INestApplication): void {
	app.enableShutdownHooks();
	const corsPolicy = resolveCorsOriginPolicy({
		appEnv: resolveAppEnv(),
		webOrigin: process.env.WEB_ORIGIN,
		webOrigins: process.env.WEB_ORIGINS,
	});
	app.enableCors({
		origin: (
			origin: string | undefined,
			callback: (error: Error | null, allow?: boolean) => void,
		) => {
			callback(null, isCorsOriginAllowed(corsPolicy, origin));
		},
		methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Authorization', 'Content-Type', 'X-Correlation-ID'],
	});
	app.useGlobalPipes(
		new StandardSchemaValidationPipe({
			exceptionFactory: (issues) =>
				new BadRequestException({
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Request validation failed',
						details: standardSchemaIssuesToDetails(issues),
					},
				}),
		}),
	);
	app.useGlobalFilters(new EnvelopeExceptionFilter());
	app.useGlobalInterceptors(new RequestLoggingInterceptor());
}
