import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Invoice} from './invoice.entity.js';
import {Practice} from './practice.entity.js';

@Entity({name: 'invoice_line_items'})
export class InvoiceLineItem {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({name: 'practice_id', type: 'uuid'})
	practiceId!: string;

	@ManyToOne(() => Practice, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'practice_id'})
	practice!: Practice;

	@Column({name: 'invoice_id', type: 'uuid'})
	invoiceId!: string;

	@ManyToOne(() => Invoice, (invoice) => invoice.lineItems, {onDelete: 'RESTRICT', nullable: false})
	@JoinColumn({name: 'invoice_id'})
	invoice!: Invoice;

	@Column({type: 'varchar', length: 200})
	description!: string;

	@Column({name: 'amount_cents', type: 'int'})
	amountCents!: number;
}
