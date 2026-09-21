import {
	BadRequestException,
	StandardSchemaValidationPipe,
	type INestApplication,
} from '@nestjs/common';
import {EnvelopeExceptionFilter, standardSchemaIssuesToDetails} from './http-exception.filter.js';
import {RequestLoggingInterceptor} from './request-logging.interceptor.js';

export function configureApp(app: INestApplication): void {
	app.enableShutdownHooks();
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
