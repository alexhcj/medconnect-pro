import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Appointment} from '../persistence/entities/appointment.entity.js';
import {AuditEvent} from '../persistence/entities/audit-event.entity.js';
import {PracticeModule} from '../practice/practice.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {AppointmentController} from './appointment.controller.js';
import {AppointmentRepository} from './appointment.repository.js';
import {AppointmentService} from './appointment.service.js';
import {AuditEventRepository} from './audit-event.repository.js';
import {AvailabilityController} from './availability.controller.js';

@Module({
	imports: [TenancyModule, PracticeModule, TypeOrmModule.forFeature([Appointment, AuditEvent])],
	controllers: [AppointmentController, AvailabilityController],
	providers: [AppointmentService, AppointmentRepository, AuditEventRepository],
})
export class SchedulingModule {}
