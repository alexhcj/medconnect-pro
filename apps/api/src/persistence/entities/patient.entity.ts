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
import {Practice} from './practice.entity.js';
import {User} from './user.entity.js';

export const PATIENT_GENDERS = ['female', 'male', 'non-binary'] as const;
export type PatientGender = (typeof PATIENT_GENDERS)[number];

export const PATIENT_STATUSES = ['active', 'inactive'] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

@Entity({name: 'patients'})
@Index('patients_practice_id_idx', ['practiceId'])
@Index('patients_practice_id_last_name_idx', ['practiceId', 'lastName'])
@Index('patients_practice_id_status_idx', ['practiceId', 'status'])
export class Patient {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'practice_id', type: 'uuid'})
	practiceId!: string;

	@ManyToOne(() => Practice, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'practice_id'})
	practice!: Practice;

	@Column({name: 'first_name', type: 'varchar', length: 100})
	firstName!: string;

	@Column({name: 'last_name', type: 'varchar', length: 100})
	lastName!: string;

	@Column({name: 'date_of_birth', type: 'varchar', length: 10})
	dateOfBirth!: string;

	@Column({type: 'varchar', length: 20})
	gender!: PatientGender;

	@Column({type: 'varchar', length: 20})
	status!: PatientStatus;

	@Column({type: 'varchar', length: 40})
	phone!: string;

	@Column({type: 'varchar', length: 320})
	email!: string;

	@Column({type: 'varchar', length: 200})
	street!: string;

	@Column({type: 'varchar', length: 100})
	city!: string;

	@Column({type: 'varchar', length: 100})
	state!: string;

	@Column({name: 'postal_code', type: 'varchar', length: 20})
	postalCode!: string;

	@Column({name: 'emergency_contact_name', type: 'varchar', length: 100})
	emergencyContactName!: string;

	@Column({name: 'emergency_contact_relationship', type: 'varchar', length: 100})
	emergencyContactRelationship!: string;

	@Column({name: 'emergency_contact_phone', type: 'varchar', length: 40})
	emergencyContactPhone!: string;

	@Column({name: 'insurance_provider', type: 'varchar', length: 200})
	insuranceProvider!: string;

	@Column({name: 'insurance_policy_number', type: 'varchar', length: 100})
	insurancePolicyNumber!: string;

	@Column({name: 'insurance_group_number', type: 'varchar', length: 100})
	insuranceGroupNumber!: string;

	@Column({name: 'assigned_provider_user_id', type: 'uuid', nullable: true})
	assignedProviderUserId!: string | null;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: true})
	@JoinColumn({name: 'assigned_provider_user_id'})
	assignedProvider!: User | null;

	@Column({name: 'portal_user_id', type: 'uuid', nullable: true, unique: true})
	portalUserId!: string | null;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: true})
	@JoinColumn({name: 'portal_user_id'})
	portalUser!: User | null;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
