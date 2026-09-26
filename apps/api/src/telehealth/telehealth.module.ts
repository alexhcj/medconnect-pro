import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditModule} from '../audit/audit.module.js';
import {TelehealthSession} from '../persistence/entities/telehealth-session.entity.js';
import {PracticeModule} from '../practice/practice.module.js';
import {SchedulingModule} from '../scheduling/scheduling.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
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
	providers: [TelehealthSessionService, TelehealthSessionRepository],
})
export class TelehealthModule {}
