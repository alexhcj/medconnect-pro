import {Module, type MiddlewareConsumer, type NestModule} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {EhrModule} from './ehr/ehr.module.js';
import {HealthModule} from './health/health.module.js';
import {IdentityModule} from './identity/identity.module.js';
import {PatientModule} from './patient/patient.module.js';
import {PersistenceModule} from './persistence/persistence.module.js';
import {SchedulingModule} from './scheduling/scheduling.module.js';
import {CorrelationIdMiddleware} from './platform/correlation.middleware.js';
import {envSchema} from './platform/env.schema.js';
import {PracticeModule} from './practice/practice.module.js';
import {TenancyModule} from './tenancy/tenant.module.js';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema: envSchema,
			envFilePath: ['.env.development', '.env'],
		}),
		PersistenceModule,
		TenancyModule,
		PracticeModule,
		PatientModule,
		EhrModule,
		SchedulingModule,
		IdentityModule,
		HealthModule,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer): void {
		consumer.apply(CorrelationIdMiddleware).forRoutes('*');
	}
}
