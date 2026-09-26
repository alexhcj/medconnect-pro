import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import {Invoice} from './invoice.entity.js';
import {Practice} from './practice.entity.js';

export const PAYMENT_METHODS = ['stripe', 'ach'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['recorded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

@Entity({name: 'payments'})
@Index('payments_practice_id_idx', ['practiceId'])
@Index('payments_practice_id_invoice_id_idx', ['practiceId', 'invoiceId'])
export class Payment {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'practice_id', type: 'uuid'})
	practiceId!: string;

	@ManyToOne(() => Practice, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'practice_id'})
	practice!: Practice;

	@Column({name: 'invoice_id', type: 'uuid'})
	invoiceId!: string;

	@ManyToOne(() => Invoice, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'invoice_id'})
	invoice!: Invoice;

	@Column({name: 'amount_cents', type: 'int'})
	amountCents!: number;

	@Column({type: 'varchar', length: 32})
	method!: PaymentMethod;

	@Column({name: 'processor_ref', type: 'varchar', length: 64})
	processorRef!: string;

	@Column({type: 'varchar', length: 32})
	status!: PaymentStatus;

	@Column({type: 'boolean', default: true})
	synthetic!: boolean;

	@CreateDateColumn({name: 'created_at', type: 'timestamptz'})
	createdAt!: Date;
}
