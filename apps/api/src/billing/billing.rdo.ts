import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {INVOICE_RDO_STATUSES} from '../persistence/entities/invoice.entity.js';
import {PAYMENT_METHODS, PAYMENT_STATUSES} from '../persistence/entities/payment.entity.js';

@ApiSchema({name: 'InvoiceLineItem'})
export class InvoiceLineItemRdo {
	@ApiProperty({example: 'Office visit'})
	description!: string;

	@ApiProperty({example: 15000, description: 'Amount in cents.'})
	amountCents!: number;
}

@ApiSchema({name: 'Invoice'})
export class InvoiceRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({
		format: 'uuid',
		description: 'Server-resolved practice id. Clients must not send this field for authorization.',
	})
	practiceId!: string;

	@ApiProperty({format: 'uuid'})
	patientId!: string;

	@ApiProperty({example: 'Avery Quinn'})
	patientName!: string;

	@ApiProperty({enum: INVOICE_RDO_STATUSES, example: 'issued'})
	status!: (typeof INVOICE_RDO_STATUSES)[number];

	@ApiProperty({example: 15000, description: 'Sum of line items in cents. Computed server-side.'})
	amountCents!: number;

	@ApiProperty({example: 'USD'})
	currency!: string;

	@ApiProperty({example: '2026-09-01T00:00:00.000Z'})
	issuedAt!: string;

	@ApiProperty({example: '2026-09-15T00:00:00.000Z'})
	dueAt!: string;

	@ApiProperty({type: [InvoiceLineItemRdo]})
	lineItems!: InvoiceLineItemRdo[];

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'InvoiceList'})
export class InvoiceListRdo {
	@ApiProperty({type: [InvoiceRdo]})
	invoices!: InvoiceRdo[];
}

@ApiSchema({name: 'InvoiceCreateRequest'})
export class InvoiceCreateRequestRdo {
	@ApiProperty({format: 'uuid'})
	patientId!: string;

	@ApiProperty({example: '2026-09-15T00:00:00.000Z'})
	dueAt!: string;

	@ApiProperty({required: false, example: 'USD', enum: ['USD']})
	currency?: 'USD';

	@ApiProperty({type: [InvoiceLineItemRdo]})
	lineItems!: InvoiceLineItemRdo[];
}

@ApiSchema({name: 'Payment'})
export class PaymentRdo {
	@ApiProperty({format: 'uuid'})
	id!: string;

	@ApiProperty({format: 'uuid'})
	invoiceId!: string;

	@ApiProperty({
		format: 'uuid',
		description: 'Server-resolved practice id. Clients must not send this field for authorization.',
	})
	practiceId!: string;

	@ApiProperty({example: 15000})
	amountCents!: number;

	@ApiProperty({enum: PAYMENT_METHODS, example: 'stripe'})
	method!: (typeof PAYMENT_METHODS)[number];

	@ApiProperty({
		example: 'demo_00000000-0000-4000-8000-000000000001',
		description: 'Opaque synthetic processor reference. Not a card or bank account number.',
	})
	processorRef!: string;

	@ApiProperty({enum: PAYMENT_STATUSES, example: 'recorded'})
	status!: (typeof PAYMENT_STATUSES)[number];

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'PaymentCreateRequest'})
export class PaymentCreateRequestRdo {
	@ApiProperty({format: 'uuid'})
	invoiceId!: string;

	@ApiProperty({enum: PAYMENT_METHODS, example: 'stripe'})
	method!: (typeof PAYMENT_METHODS)[number];
}

export const CLAIM_STATUSES = ['not_submitted'] as const;

@ApiSchema({name: 'Claim'})
export class ClaimRdo {
	@ApiProperty({format: 'uuid', description: 'Derived envelope id (same as invoice id).'})
	id!: string;

	@ApiProperty({format: 'uuid'})
	invoiceId!: string;

	@ApiProperty({enum: CLAIM_STATUSES, example: 'not_submitted'})
	status!: (typeof CLAIM_STATUSES)[number];

	@ApiProperty({
		example: 'edi837',
		description: 'Labeled claims boundary. EDI 837 is not generated.',
	})
	processor!: 'edi837';

	@ApiProperty({
		example: true,
		description: 'Always true. This API stores synthetic demo data only.',
	})
	synthetic!: boolean;
}

@ApiSchema({name: 'ClaimList'})
export class ClaimListRdo {
	@ApiProperty({type: [ClaimRdo]})
	claims!: ClaimRdo[];
}
