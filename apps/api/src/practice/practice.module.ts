import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditModule} from '../audit/audit.module.js';
import {PatientAssignment} from '../persistence/entities/patient-assignment.entity.js';
import {Patient} from '../persistence/entities/patient.entity.js';
import {PracticeMembership} from '../persistence/entities/practice-membership.entity.js';
import {Practice} from '../persistence/entities/practice.entity.js';
import {User} from '../persistence/entities/user.entity.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {MembershipRepository} from './membership.repository.js';
import {PatientRepository} from './patient.repository.js';
import {PracticeRepository} from './practice.repository.js';
import {PracticeUserController} from './practice-user.controller.js';
import {PracticeUserService} from './practice-user.service.js';

@Module({
	imports: [
		TenancyModule,
		AuditModule,
		TypeOrmModule.forFeature([Practice, User, PracticeMembership, Patient, PatientAssignment]),
	],
	controllers: [PracticeUserController],
	providers: [PracticeRepository, PatientRepository, MembershipRepository, PracticeUserService],
	exports: [PracticeRepository, PatientRepository, MembershipRepository],
})
export class PracticeModule {}
