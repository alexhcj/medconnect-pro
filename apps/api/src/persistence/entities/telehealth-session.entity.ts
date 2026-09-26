import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Unique,
	UpdateDateColumn,
} from 'typeorm';
import {Appointment} from './appointment.entity.js';
import {Practice} from './practice.entity.js';

export const TELEHEALTH_SESSION_STATES = ['waiting', 'in_session', 'ended'] as const;
export type TelehealthSessionState = (typeof TELEHEALTH_SESSION_STATES)[number];

@Entity({name: 'telehealth_sessions'})
@Unique('telehealth_sessions_appointment_id_key', ['appointmentId'])
@Index('telehealth_sessions_practice_id_idx', ['practiceId'])
@Index('telehealth_sessions_practice_id_state_idx', ['practiceId', 'state'])
export class TelehealthSession {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'practice_id', type: 'uuid'})
	practiceId!: string;

	@ManyToOne(() => Practice, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'practice_id'})
	practice!: Practice;

	@Column({name: 'appointment_id', type: 'uuid'})
	appointmentId!: string;

	@ManyToOne(() => Appointment, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'appointment_id'})
	appointment!: Appointment;

	@Column({type: 'varchar', length: 32})
	state!: TelehealthSessionState;

	@Column({name: 'waiting_started_at', type: 'timestamptz'})
	waitingStartedAt!: Date;

	@Column({name: 'joined_at', type: 'timestamptz', nullable: true})
	joinedAt!: Date | null;

	@Column({name: 'ended_at', type: 'timestamptz', nullable: true})
	endedAt!: Date | null;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
