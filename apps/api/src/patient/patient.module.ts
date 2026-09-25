import {Module} from '@nestjs/common';
import {AuditModule} from '../audit/audit.module.js';
import {PracticeModule} from '../practice/practice.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {PatientController} from './patient.controller.js';
import {PatientService} from './patient.service.js';

@Module({
	imports: [TenancyModule, PracticeModule, AuditModule],
	controllers: [PatientController],
	providers: [PatientService],
})
export class PatientModule {}
