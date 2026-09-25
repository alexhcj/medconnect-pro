import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditEvent} from '../persistence/entities/audit-event.entity.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {AuditEventRepository} from './audit-event.repository.js';

@Module({
	imports: [TenancyModule, TypeOrmModule.forFeature([AuditEvent])],
	providers: [AuditEventRepository],
	exports: [AuditEventRepository],
})
export class AuditModule {}
