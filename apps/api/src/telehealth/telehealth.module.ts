import {Module} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditModule} from '../audit/audit.module.js';
import {TelehealthSession} from '../persistence/entities/telehealth-session.entity.js';
import type {Env} from '../platform/env.schema.js';
import {PracticeModule} from '../practice/practice.module.js';
import {SchedulingModule} from '../scheduling/scheduling.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {createDailyMediaAdapter} from './daily-media-factory.js';
import {DAILY_MEDIA_PORT} from './daily-media-port.js';
import {TelehealthSessionController} from './telehealth-session.controller.js';
import {TelehealthSessionRepository} from './telehealth-session.repository.js';
import {TelehealthSessionService} from './telehealth-session.service.js';

@Module({
	imports: [
		TenancyModule,
		PracticeModule,
		AuditModule,
		SchedulingModule,
		TypeOrmModule.forFeature([TelehealthSession]),
	],
	controllers: [TelehealthSessionController],
	providers: [
		TelehealthSessionService,
		TelehealthSessionRepository,
		{
			provide: DAILY_MEDIA_PORT,
			useFactory: (config: ConfigService<Env, true>) =>
				createDailyMediaAdapter(config.get('DAILY_API_KEY', {infer: true})),
			inject: [ConfigService],
		},
	],
})
export class TelehealthModule {}
