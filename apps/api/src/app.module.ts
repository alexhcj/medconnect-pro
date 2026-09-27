import {Module, type MiddlewareConsumer, type NestModule} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {APP_INTERCEPTOR} from '@nestjs/core';
import {AuditAccessDeniedInterceptor} from './audit/audit-access-denied.interceptor.js';
import {AuditModule} from './audit/audit.module.js';
import {BillingModule} from './billing/billing.module.js';
import {DocumentsModule} from './documents/documents.module.js';
import {EhrModule} from './ehr/ehr.module.js';
import {HealthModule} from './health/health.module.js';
import {IdentityModule} from './identity/identity.module.js';
import {NotificationsModule} from './notifications/notifications.module.js';
import {PatientModule} from './patient/patient.module.js';
import {PersistenceModule} from './persistence/persistence.module.js';
import {SchedulingModule} from './scheduling/scheduling.module.js';
import {TelehealthModule} from './telehealth/telehealth.module.js';
import {CorrelationIdMiddleware} from './platform/correlation.middleware.js';
import {envSchema} from './platform/env.schema.js';
import {PracticeModule} from './practice/practice.module.js';
import {TenancyModule} from './tenancy/tenant.module.js';
import {TenantRlsInterceptor} from './tenancy/tenant-rls.interceptor.js';

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
		AuditModule,
		PatientModule,
		EhrModule,
		SchedulingModule,
		TelehealthModule,
		BillingModule,
		DocumentsModule,
		NotificationsModule,
		IdentityModule,
		HealthModule,
	],
	providers: [
		{provide: APP_INTERCEPTOR, useClass: AuditAccessDeniedInterceptor},
		{provide: APP_INTERCEPTOR, useClass: TenantRlsInterceptor},
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer): void {
		consumer.apply(CorrelationIdMiddleware).forRoutes('*');
	}
}
