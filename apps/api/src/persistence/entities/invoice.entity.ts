import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import {InvoiceLineItem} from './invoice-line-item.entity.js';
import {Patient} from './patient.entity.js';
import {Practice} from './practice.entity.js';

export const INVOICE_PERSISTED_STATUSES = ['issued', 'paid'] as const;
export type InvoicePersistedStatus = (typeof INVOICE_PERSISTED_STATUSES)[number];

export const INVOICE_RDO_STATUSES = ['issued', 'paid', 'overdue'] as const;
export type InvoiceRdoStatus = (typeof INVOICE_RDO_STATUSES)[number];

@Entity({name: 'invoices'})
@Index('invoices_practice_id_idx', ['practiceId'])
@Index('invoices_practice_id_patient_id_idx', ['practiceId', 'patientId'])
export class Invoice {
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
	status!: InvoicePersistedStatus;

	@Column({name: 'amount_cents', type: 'int'})
	amountCents!: number;

	@Column({type: 'varchar', length: 3, default: 'USD'})
	currency!: string;

	@Column({name: 'issued_at', type: 'timestamptz'})
	issuedAt!: Date;

	@Column({name: 'due_at', type: 'timestamptz'})
	dueAt!: Date;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@OneToMany(() => InvoiceLineItem, (item) => item.invoice, {cascade: ['insert']})
	lineItems!: InvoiceLineItem[];

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;

	@UpdateDateColumn({name: 'updated_at', type: 'timestamptz'})
	updatedAt!: Date;
}
