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

export const MEDICATION_STATUSES = ['active', 'discontinued', 'completed'] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];

@Entity({name: 'medications'})
@Index('medications_practice_id_patient_id_start_date_idx', ['practiceId', 'patientId', 'startDate'])
export class Medication {
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
	name!: string;

	@Column({type: 'varchar', length: 100})
	dosage!: string;

	@Column({type: 'varchar', length: 100})
	frequency!: string;

	@Column({type: 'varchar', length: 100})
	route!: string;

	@Column({name: 'start_date', type: 'varchar', length: 10})
	startDate!: string;

	@Column({name: 'end_date', type: 'varchar', length: 10, nullable: true})
	endDate!: string | null;

	@Column({name: 'prescriber_user_id', type: 'uuid'})
	prescriberUserId!: string;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'prescriber_user_id'})
	prescriber!: User;

	@Column({type: 'varchar', length: 500})
	instructions!: string;

	@Column({type: 'varchar', length: 32})
	status!: MedicationStatus;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
