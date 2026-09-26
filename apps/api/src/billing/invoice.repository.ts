import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {InvoiceLineItem} from '../persistence/entities/invoice-line-item.entity.js';
import {Invoice, type InvoicePersistedStatus} from '../persistence/entities/invoice.entity.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';

export type InvoiceLineItemWriteInput = {
	description: string;
	amountCents: number;
};

export type InvoiceWriteInput = {
	patientId: string;
	dueAt: Date;
	issuedAt: Date;
	currency: string;
	lineItems: InvoiceLineItemWriteInput[];
	practiceId?: string;
};

const INVOICE_RELATIONS = {
	lineItems: true,
	patient: true,
} as const;

@Injectable()
export class InvoiceRepository {
	constructor(
		@InjectRepository(Invoice)
		private readonly rows: Repository<Invoice>,
		@InjectRepository(InvoiceLineItem)
		private readonly lineItems: Repository<InvoiceLineItem>,
		private readonly tenant: TenantContext,
	) {}

	async list(filter?: {portalUserId?: string}): Promise<Invoice[]> {
		const {practiceId} = this.tenant.require();
		const qb = this.rows
			.createQueryBuilder('invoice')
			.leftJoinAndSelect('invoice.lineItems', 'lineItem')
			.leftJoinAndSelect('invoice.patient', 'patient')
			.where('invoice.practiceId = :practiceId', {practiceId});
		if (filter?.portalUserId) {
			qb.andWhere('patient.portalUserId = :portalUserId', {portalUserId: filter.portalUserId});
		}
		qb.orderBy('invoice.issuedAt', 'DESC').addOrderBy('invoice.id', 'DESC');
		qb.addOrderBy('lineItem.id', 'ASC');
		return qb.getMany();
	}

	async getById(id: string): Promise<Invoice | undefined> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows.findOne({
			where: {id, practiceId},
			relations: INVOICE_RELATIONS,
			order: {lineItems: {id: 'ASC'}},
		});
		return row ?? undefined;
	}

	async create(input: InvoiceWriteInput): Promise<Invoice> {
		const {practiceId} = this.tenant.require();
		rejectMismatchedPracticeId(input.practiceId, practiceId);
		const amountCents = input.lineItems.reduce((sum, item) => sum + item.amountCents, 0);
		const row = this.rows.create({
			practiceId,
			patientId: input.patientId,
			status: 'issued',
			amountCents,
			currency: input.currency,
			issuedAt: input.issuedAt,
			dueAt: input.dueAt,
			synthetic: true,
			lineItems: input.lineItems.map((item) =>
				this.lineItems.create({
					practiceId,
					description: item.description,
					amountCents: item.amountCents,
				}),
			),
		});
		const saved = await this.rows.save(row);
		return (await this.getById(saved.id)) ?? saved;
	}

	async markPaid(invoice: Invoice): Promise<Invoice> {
		invoice.status = 'paid' satisfies InvoicePersistedStatus;
		await this.rows.save(invoice);
		return (await this.getById(invoice.id)) ?? invoice;
	}
}

function rejectMismatchedPracticeId(
	clientPracticeId: string | undefined,
	scopePracticeId: string,
): void {
	if (clientPracticeId !== undefined && clientPracticeId !== scopePracticeId) {
		throw new TenantMismatchError();
	}
}
