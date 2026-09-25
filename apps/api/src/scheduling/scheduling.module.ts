import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditModule} from '../audit/audit.module.js';
import {Appointment} from '../persistence/entities/appointment.entity.js';
import {PracticeModule} from '../practice/practice.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {AppointmentController} from './appointment.controller.js';
import {AppointmentRepository} from './appointment.repository.js';
import {AppointmentService} from './appointment.service.js';
import {AvailabilityController} from './availability.controller.js';

@Module({
	imports: [TenancyModule, PracticeModule, AuditModule, TypeOrmModule.forFeature([Appointment])],
	controllers: [AppointmentController, AvailabilityController],
	providers: [AppointmentService, AppointmentRepository],
})
export class SchedulingModule {}
