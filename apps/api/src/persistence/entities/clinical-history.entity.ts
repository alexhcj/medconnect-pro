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

export const HISTORY_ENTRY_TYPES = ['visit', 'consultation', 'procedure'] as const;
export type HistoryEntryType = (typeof HISTORY_ENTRY_TYPES)[number];

export const HISTORY_ENTRY_STATUSES = ['draft', 'completed', 'reviewed', 'amended'] as const;
export type HistoryEntryStatus = (typeof HISTORY_ENTRY_STATUSES)[number];

@Entity({name: 'clinical_history'})
@Index('clinical_history_practice_id_patient_id_occurred_at_idx', [
	'practiceId',
	'patientId',
	'occurredAt',
])
export class ClinicalHistory {
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

	@Column({type: 'varchar', length: 32})
	type!: HistoryEntryType;

	@Column({name: 'occurred_at', type: 'timestamptz'})
	occurredAt!: Date;

	@Column({type: 'varchar', length: 200})
	title!: string;

	@Column({type: 'varchar', length: 2000})
	summary!: string;

	@Column({name: 'provider_user_id', type: 'uuid'})
	providerUserId!: string;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'provider_user_id'})
	provider!: User;

	@Column({type: 'varchar', length: 32})
	status!: HistoryEntryStatus;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
