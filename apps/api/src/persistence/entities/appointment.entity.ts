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

export const APPOINTMENT_TYPES = ['office_visit', 'telehealth', 'follow_up'] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const APPOINTMENT_STATES = ['scheduled', 'confirmed', 'cancelled', 'completed'] as const;
export type AppointmentState = (typeof APPOINTMENT_STATES)[number];

export const APPOINTMENT_CREATE_STATES = ['scheduled', 'confirmed'] as const;
export type AppointmentCreateState = (typeof APPOINTMENT_CREATE_STATES)[number];

@Entity({name: 'appointments'})
@Index('appointments_practice_id_start_at_idx', ['practiceId', 'startAt'])
@Index('appointments_practice_id_provider_user_id_start_at_idx', ['practiceId', 'providerUserId', 'startAt'])
@Index('appointments_practice_id_patient_id_idx', ['practiceId', 'patientId'])
export class Appointment {
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

	@Column({name: 'provider_user_id', type: 'uuid'})
	providerUserId!: string;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'provider_user_id'})
	provider!: User;

	@Column({name: 'start_at', type: 'timestamptz'})
	startAt!: Date;

	@Column({name: 'end_at', type: 'timestamptz'})
	endAt!: Date;

	@Column({type: 'varchar', length: 32})
	type!: AppointmentType;

	@Column({type: 'varchar', length: 32})
	state!: AppointmentState;

	@Column({type: 'varchar', length: 500, nullable: true})
	notes!: string | null;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
