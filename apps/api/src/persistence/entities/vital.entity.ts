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

@Entity({name: 'vitals'})
@Index('vitals_practice_id_patient_id_recorded_at_idx', ['practiceId', 'patientId', 'recordedAt'])
export class Vital {
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

	@Column({name: 'recorded_at', type: 'timestamptz'})
	recordedAt!: Date;

	@Column({name: 'systolic_mm_hg', type: 'integer'})
	systolicMmHg!: number;

	@Column({name: 'diastolic_mm_hg', type: 'integer'})
	diastolicMmHg!: number;

	@Column({name: 'heart_rate_bpm', type: 'integer'})
	heartRateBpm!: number;

	@Column({name: 'temperature_c', type: 'double precision'})
	temperatureC!: number;

	@Column({name: 'respiratory_rate', type: 'integer'})
	respiratoryRate!: number;

	@Column({name: 'spo2_percent', type: 'integer'})
	spo2Percent!: number;

	@Column({name: 'weight_kg', type: 'double precision'})
	weightKg!: number;

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
