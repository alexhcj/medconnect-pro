import {Module} from '@nestjs/common';
import {PracticeModule} from '../practice/practice.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {PatientController} from './patient.controller.js';
import {PatientService} from './patient.service.js';

@Module({
	imports: [TenancyModule, PracticeModule],
	controllers: [PatientController],
	providers: [PatientService],
})
export class PatientModule {}
