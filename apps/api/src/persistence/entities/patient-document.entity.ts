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

export const DOCUMENT_CATEGORIES = ['intake', 'insurance', 'clinical'] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CONTENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg'] as const;
export type DocumentContentType = (typeof DOCUMENT_CONTENT_TYPES)[number];

@Entity({name: 'patient_documents'})
@Index('patient_documents_practice_id_patient_id_created_at_idx', [
	'practiceId',
	'patientId',
	'createdAt',
])
export class PatientDocument {
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

	@Column({name: 'content_type', type: 'varchar', length: 64})
	contentType!: DocumentContentType;

	@Column({type: 'varchar', length: 32})
	category!: DocumentCategory;

	@Column({name: 'size_bytes', type: 'integer'})
	sizeBytes!: number;

	@Column({name: 'storage_key', type: 'varchar', length: 500})
	storageKey!: string;

	@Column({name: 'uploaded_by_user_id', type: 'uuid'})
	uploadedByUserId!: string;

	@ManyToOne(() => User, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'uploaded_by_user_id'})
	uploadedBy!: User;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
