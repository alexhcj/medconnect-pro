import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AuditModule} from '../audit/audit.module.js';
import {ClinicalCondition} from '../persistence/entities/clinical-condition.entity.js';
import {ClinicalHistory} from '../persistence/entities/clinical-history.entity.js';
import {Medication} from '../persistence/entities/medication.entity.js';
import {Vital} from '../persistence/entities/vital.entity.js';
import {PracticeModule} from '../practice/practice.module.js';
import {TenancyModule} from '../tenancy/tenant.module.js';
import {ClinicalConditionRepository} from './clinical-condition.repository.js';
import {ClinicalHistoryRepository} from './clinical-history.repository.js';
import {ClinicalService} from './clinical.service.js';
import {ConditionsController} from './conditions.controller.js';
import {HistoryController} from './history.controller.js';
import {MedicationRepository} from './medication.repository.js';
import {MedicationsController} from './medications.controller.js';
import {VitalRepository} from './vital.repository.js';
import {VitalsController} from './vitals.controller.js';

@Module({
	imports: [
		TenancyModule,
		PracticeModule,
		AuditModule,
		TypeOrmModule.forFeature([ClinicalHistory, ClinicalCondition, Vital, Medication]),
	],
	controllers: [HistoryController, ConditionsController, VitalsController, MedicationsController],
	providers: [
		ClinicalService,
		ClinicalHistoryRepository,
		ClinicalConditionRepository,
		VitalRepository,
		MedicationRepository,
	],
})
export class EhrModule {}
