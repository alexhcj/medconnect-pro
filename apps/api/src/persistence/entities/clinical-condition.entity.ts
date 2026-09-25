import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import {Patient} from './patient.entity.js';
import {Practice} from './practice.entity.js';
import {User} from './user.entity.js';

export const CLINICAL_CONDITION_STATUSES = ['active', 'resolved', 'inactive'] as const;
export type ClinicalConditionStatus = (typeof CLINICAL_CONDITION_STATUSES)[number];

@Entity({name: 'clinical_conditions'})
@Index('clinical_conditions_practice_id_patient_id_recorded_at_idx', [
	'practiceId',
	'patientId',
	'recordedAt',
])
export class ClinicalCondition {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'practice_id', type: 'uuid'})
	practiceId!: string;

	@ManyToOne(() => Practice, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'practice_id'})
	practice!: Practice;

	@Column({name: 'patient_id', type: 'uuid'})
	patientId!: string;

	@ManyToOne(() => Patient, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'patient_id'})
	patient!: Patient;

	@Column({type: 'varchar', length: 200})
	display!: string;

	@Column({name: 'clinical_status', type: 'varchar', length: 32})
	clinicalStatus!: ClinicalConditionStatus;

	@Column({name: 'recorded_at', type: 'timestamptz'})
	recordedAt!: Date;

	@Column({name: 'recorded_by_user_id', type: 'uuid'})
	recordedByUserId!: string;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'recorded_by_user_id'})
	recordedBy!: User;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
