import {Module, type MiddlewareConsumer, type NestModule} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {HealthModule} from './health/health.module.js';
import {CorrelationIdMiddleware} from './platform/correlation.middleware.js';
import {envSchema} from './platform/env.schema.js';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema: envSchema,
		}),
		HealthModule,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer): void {
		consumer.apply(CorrelationIdMiddleware).forRoutes('*');
	}
}
