import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In, Repository} from 'typeorm';
import {InvoiceLineItem} from '../persistence/entities/invoice-line-item.entity.js';
import {
	Invoice,
	type InvoicePersistedStatus,
	type InvoiceRdoStatus,
} from '../persistence/entities/invoice.entity.js';
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

export type InvoiceListFilter = {
	page: number;
	pageSize: number;
	sort?: 'issued-desc' | 'issued-asc';
	status?: InvoiceRdoStatus;
	/** Reference time shared with the response mapper so `overdue` filter and display agree. */
	now: Date;
	portalUserId?: string;
};

export type InvoicePage = {rows: Invoice[]; total: number};

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

	async sumAmountCentsIssuedInUtcMonth(now: Date): Promise<{amountCents: number; currency: string}> {
		const {practiceId} = this.tenant.require();
		const {from, to} = utcMonthBounds(now);
		const row = await this.rows
			.createQueryBuilder('invoice')
			.select('COALESCE(SUM(invoice.amountCents), 0)', 'amountCents')
			.addSelect("COALESCE(MIN(invoice.currency), 'USD')", 'currency')
			.where('invoice.practiceId = :practiceId', {practiceId})
			.andWhere('invoice.issuedAt >= :from', {from})
			.andWhere('invoice.issuedAt < :to', {to})
			.getRawOne<{amountCents: string | number; currency: string}>();
		return {
			amountCents: Number(row?.amountCents ?? 0),
			currency: row?.currency || 'USD',
		};
	}

	async sumOpenBalanceForPortalUser(
		portalUserId: string,
	): Promise<{amountCents: number; currency: string}> {
		const {practiceId} = this.tenant.require();
		const row = await this.rows
			.createQueryBuilder('invoice')
			.innerJoin('invoice.patient', 'patient')
			.select('COALESCE(SUM(invoice.amountCents), 0)', 'amountCents')
			.addSelect("COALESCE(MIN(invoice.currency), 'USD')", 'currency')
			.where('invoice.practiceId = :practiceId', {practiceId})
			.andWhere('patient.portalUserId = :portalUserId', {portalUserId})
			.andWhere("invoice.status = 'issued'")
			.getRawOne<{amountCents: string | number; currency: string}>();
		return {
			amountCents: Number(row?.amountCents ?? 0),
			currency: row?.currency || 'USD',
		};
	}

	/**
	 * One page of invoices. Tenant, own-patient scope and filters are applied before paging, so
	 * `total` counts only rows visible to the caller. Ids are paged first so line-item joins cannot
	 * distort `skip`/`take`.
	 */
	async list(query: InvoiceListFilter): Promise<InvoicePage> {
		const {practiceId} = this.tenant.require();
		const {page, pageSize} = query;
		const direction = query.sort === 'issued-asc' ? 'ASC' : 'DESC';
		const idQb = this.rows
			.createQueryBuilder('invoice')
			.innerJoin('invoice.patient', 'patient')
			.select('invoice.id', 'id')
			.where('invoice.practiceId = :practiceId', {practiceId});
		if (query.portalUserId) {
			idQb.andWhere('patient.portalUserId = :portalUserId', {portalUserId: query.portalUserId});
		}
		if (query.status === 'paid') {
			idQb.andWhere("invoice.status = 'paid'");
		} else if (query.status === 'overdue') {
			idQb.andWhere("invoice.status = 'issued'").andWhere('invoice.dueAt < :now', {now: query.now});
		} else if (query.status === 'issued') {
			idQb.andWhere("invoice.status = 'issued'").andWhere('invoice.dueAt >= :now', {now: query.now});
		}
		const total = await idQb.getCount();
		const idRows = await idQb
			.orderBy('invoice.issuedAt', direction)
			.addOrderBy('invoice.id', direction)
			.offset((page - 1) * pageSize)
			.limit(pageSize)
			.getRawMany<{id: string}>();
		const ids = idRows.map((row) => row.id);
		if (ids.length === 0) {
			return {rows: [], total};
		}
		const loaded = await this.rows.find({
			where: {id: In(ids), practiceId},
			relations: INVOICE_RELATIONS,
			order: {lineItems: {id: 'ASC'}},
		});
		const byId = new Map(loaded.map((row) => [row.id, row]));
		const rows = ids.flatMap((id) => {
			const row = byId.get(id);
			return row ? [row] : [];
		});
		return {rows, total};
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

function utcMonthBounds(now: Date): {from: Date; to: Date} {
	const year = now.getUTCFullYear();
	const month = now.getUTCMonth();
	const from = new Date(Date.UTC(year, month, 1));
	const to = new Date(Date.UTC(year, month + 1, 1));
	return {from, to};
}

function rejectMismatchedPracticeId(
	clientPracticeId: string | undefined,
	scopePracticeId: string,
): void {
	if (clientPracticeId !== undefined && clientPracticeId !== scopePracticeId) {
		throw new TenantMismatchError();
	}
}
