import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {
	CLINICAL_CONDITION_STATUSES,
} from '../persistence/entities/clinical-condition.entity.js';
import {
	HISTORY_ENTRY_STATUSES,
	HISTORY_ENTRY_TYPES,
} from '../persistence/entities/clinical-history.entity.js';
import {MEDICATION_STATUSES} from '../persistence/entities/medication.entity.js';

@ApiSchema({name: 'HistoryEntry'})
export class HistoryEntryRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({
		format: 'uuid',
		description: 'Server-resolved practice id. Clients must not send this field for authorization.',
	})
	practiceId!: string;

	@ApiProperty({format: 'uuid'})
	patientId!: string;

	@ApiProperty({enum: HISTORY_ENTRY_TYPES, example: 'visit'})
	type!: (typeof HISTORY_ENTRY_TYPES)[number];

	@ApiProperty({example: '2025-07-15T10:30:00.000Z'})
	occurredAt!: string;

	@ApiProperty({example: 'Hypertension follow-up'})
	title!: string;

	@ApiProperty({example: 'Blood pressure stable on current medication. Continue current plan.'})
	summary!: string;

	@ApiProperty({format: 'uuid'})
	providerId!: string;

	@ApiProperty({enum: HISTORY_ENTRY_STATUSES, example: 'completed'})
	status!: (typeof HISTORY_ENTRY_STATUSES)[number];

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'HistoryList'})
export class HistoryListRdo {
	@ApiProperty({type: [HistoryEntryRdo]})
	history!: HistoryEntryRdo[];
}

@ApiSchema({name: 'HistoryCreateRequest'})
export class HistoryCreateRequestRdo {
	@ApiProperty({enum: HISTORY_ENTRY_TYPES, example: 'visit'})
	type!: (typeof HISTORY_ENTRY_TYPES)[number];

	@ApiProperty({example: '2025-07-15T10:30:00.000Z'})
	occurredAt!: string;

	@ApiProperty({example: 'Hypertension follow-up'})
	title!: string;

	@ApiProperty({example: 'Blood pressure stable on current medication. Continue current plan.'})
	summary!: string;

	@ApiProperty({enum: HISTORY_ENTRY_STATUSES, example: 'completed'})
	status!: (typeof HISTORY_ENTRY_STATUSES)[number];
}

@ApiSchema({name: 'ClinicalCondition'})
export class ClinicalConditionRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({
		format: 'uuid',
		description: 'Server-resolved practice id. Clients must not send this field for authorization.',
	})
	practiceId!: string;

	@ApiProperty({format: 'uuid'})
	patientId!: string;

	@ApiProperty({
		example: 'Hypertension',
		description: 'Human-readable condition text (FHIR Condition.code.text alignment). Not a coded system.',
	})
	display!: string;

	@ApiProperty({enum: CLINICAL_CONDITION_STATUSES, example: 'active'})
	clinicalStatus!: (typeof CLINICAL_CONDITION_STATUSES)[number];

	@ApiProperty({example: '2025-07-15T10:30:00.000Z'})
	recordedAt!: string;

	@ApiProperty({format: 'uuid'})
	recordedById!: string;

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'ConditionList'})
export class ConditionListRdo {
	@ApiProperty({type: [ClinicalConditionRdo]})
	conditions!: ClinicalConditionRdo[];
}

@ApiSchema({name: 'ConditionCreateRequest'})
export class ConditionCreateRequestRdo {
	@ApiProperty({example: 'Hypertension'})
	display!: string;

	@ApiProperty({enum: CLINICAL_CONDITION_STATUSES, example: 'active'})
	clinicalStatus!: (typeof CLINICAL_CONDITION_STATUSES)[number];

	@ApiProperty({example: '2025-07-15T10:30:00.000Z'})
	recordedAt!: string;
}

@ApiSchema({name: 'Vital'})
export class VitalRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({
		format: 'uuid',
		description: 'Server-resolved practice id. Clients must not send this field for authorization.',
	})
	practiceId!: string;

	@ApiProperty({format: 'uuid'})
	patientId!: string;

	@ApiProperty({example: '2025-07-15T10:15:00.000Z'})
	recordedAt!: string;

	@ApiProperty({example: 128})
	systolicMmHg!: number;

	@ApiProperty({example: 82})
	diastolicMmHg!: number;

	@ApiProperty({example: 72})
	heartRateBpm!: number;

	@ApiProperty({example: 36.7})
	temperatureC!: number;

	@ApiProperty({example: 16})
	respiratoryRate!: number;

	@ApiProperty({example: 98})
	spo2Percent!: number;

	@ApiProperty({example: 72.5})
	weightKg!: number;

	@ApiProperty({format: 'uuid'})
	recordedById!: string;

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'VitalList'})
export class VitalListRdo {
	@ApiProperty({type: [VitalRdo]})
	vitals!: VitalRdo[];
}

@ApiSchema({name: 'VitalCreateRequest'})
export class VitalCreateRequestRdo {
	@ApiProperty({example: '2025-07-15T10:15:00.000Z'})
	recordedAt!: string;

	@ApiProperty({example: 128})
	systolicMmHg!: number;

	@ApiProperty({example: 82})
	diastolicMmHg!: number;

	@ApiProperty({example: 72})
	heartRateBpm!: number;

	@ApiProperty({example: 36.7})
	temperatureC!: number;

	@ApiProperty({example: 16})
	respiratoryRate!: number;

	@ApiProperty({example: 98})
	spo2Percent!: number;

	@ApiProperty({example: 72.5})
	weightKg!: number;
}

@ApiSchema({name: 'Medication'})
export class MedicationRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({
		format: 'uuid',
		description: 'Server-resolved practice id. Clients must not send this field for authorization.',
	})
	practiceId!: string;

	@ApiProperty({format: 'uuid'})
	patientId!: string;

	@ApiProperty({example: 'Lisinopril'})
	name!: string;

	@ApiProperty({example: '10mg'})
	dosage!: string;

	@ApiProperty({example: 'Once daily'})
	frequency!: string;

	@ApiProperty({example: 'oral'})
	route!: string;

	@ApiProperty({example: '2023-01-10', description: 'ISO date (YYYY-MM-DD).'})
	startDate!: string;

	@ApiProperty({required: false, example: '2026-01-10', description: 'ISO date (YYYY-MM-DD).'})
	endDate?: string;

	@ApiProperty({format: 'uuid'})
	prescriberId!: string;

	@ApiProperty({example: 'Take in the morning with water'})
	instructions!: string;

	@ApiProperty({enum: MEDICATION_STATUSES, example: 'active'})
	status!: (typeof MEDICATION_STATUSES)[number];

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'MedicationList'})
export class MedicationListRdo {
	@ApiProperty({type: [MedicationRdo]})
	medications!: MedicationRdo[];
}

@ApiSchema({name: 'MedicationCreateRequest'})
export class MedicationCreateRequestRdo {
	@ApiProperty({example: 'Lisinopril'})
	name!: string;

	@ApiProperty({example: '10mg'})
	dosage!: string;

	@ApiProperty({example: 'Once daily'})
	frequency!: string;

	@ApiProperty({example: 'oral'})
	route!: string;

	@ApiProperty({example: '2023-01-10'})
	startDate!: string;

	@ApiProperty({required: false, example: '2026-01-10'})
	endDate?: string;

	@ApiProperty({example: 'Take in the morning with water'})
	instructions!: string;

	@ApiProperty({enum: MEDICATION_STATUSES, example: 'active'})
	status!: (typeof MEDICATION_STATUSES)[number];
}
