import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Unique,
} from 'typeorm';
import {Patient} from './patient.entity.js';
import {Practice} from './practice.entity.js';
import {User} from './user.entity.js';

@Entity({name: 'patient_assignments'})
@Unique('patient_assignments_patient_id_user_id_key', ['patientId', 'userId'])
@Index('patient_assignments_practice_id_user_id_idx', ['practiceId', 'userId'])
export class PatientAssignment {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'practice_id', type: 'uuid'})
	practiceId!: string;

	@ManyToOne(() => Practice, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'practice_id'})
	practice!: Practice;

	@Column({name: 'patient_id', type: 'uuid'})
	patientId!: string;

	@ManyToOne(() => Patient, {onDelete: 'CASCADE', nullable: false})
	@JoinColumn({name: 'patient_id'})
	patient!: Patient;

	@Column({name: 'user_id', type: 'uuid'})
	userId!: string;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'user_id'})
	user!: User;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;
}
