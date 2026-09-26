import {Inject, Injectable} from '@nestjs/common';
import {REQUEST} from '@nestjs/core';
import type {Request} from 'express';
import {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import type {Invoice, InvoiceRdoStatus} from '../persistence/entities/invoice.entity.js';
import type {Patient} from '../persistence/entities/patient.entity.js';
import type {Payment} from '../persistence/entities/payment.entity.js';
import {getCorrelationId} from '../platform/correlation.js';
import {PatientRepository} from '../practice/patient.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import {TenantMismatchError} from '../tenancy/tenant-errors.js';
import {
	canCreateInvoice,
	canRecordPayment,
	resolveBillingReadScope,
} from './billing-access.js';
import {
	InvoiceAlreadyPaidError,
	InvoiceNotFoundError,
	InvalidInvoicePatientError,
} from './billing.errors.js';
import type {
	ClaimListRdo,
	ClaimRdo,
	InvoiceListRdo,
	InvoiceRdo,
	PaymentRdo,
} from './billing.rdo.js';
import type {InvoiceCreateBody, PaymentCreateBody} from './billing.schema.js';
import {InvoiceRepository} from './invoice.repository.js';
import {PAYMENT_GATEWAY, type PaymentGateway} from './payment-gateway.js';
import {PaymentRepository} from './payment.repository.js';

@Injectable()
export class BillingService {
	constructor(
		private readonly invoices: InvoiceRepository,
		private readonly payments: PaymentRepository,
		private readonly patients: PatientRepository,
		private readonly audit: AuditEventRepository,
		private readonly tenant: TenantContext,
		@Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
		@Inject(REQUEST) private readonly request: Request,
	) {}

	async listInvoices(): Promise<InvoiceListRdo> {
		const rows = await this.listVisibleInvoices();
		return {invoices: rows.map((row) => toInvoiceRdo(row))};
	}

	async getInvoice(id: string): Promise<InvoiceRdo> {
		const row = await this.loadVisibleInvoice(id);
		return toInvoiceRdo(row);
	}

	async createInvoice(input: InvoiceCreateBody): Promise<InvoiceRdo> {
		this.assertCanCreate();
		await this.assertPatient(input.patientId);
		const row = await this.invoices.create({
			patientId: input.patientId,
			dueAt: new Date(input.dueAt),
			issuedAt: new Date(),
			currency: input.currency ?? 'USD',
			lineItems: input.lineItems,
			practiceId: input.practiceId,
		});
		await this.recordAudit('invoice.created', 'invoice', row.id);
		return toInvoiceRdo(row);
	}

	async recordPayment(input: PaymentCreateBody): Promise<PaymentRdo> {
		this.assertCanRecordPayment();
		this.rejectMismatchedPracticeId(input.practiceId);
		const invoice = await this.loadVisibleInvoice(input.invoiceId);
		if (invoice.status === 'paid') {
			throw new InvoiceAlreadyPaidError();
		}
		const charged = await this.gateway.charge({
			invoiceId: invoice.id,
			amountCents: invoice.amountCents,
			method: input.method,
		});
		const payment = await this.payments.create({
			invoiceId: invoice.id,
			amountCents: invoice.amountCents,
			method: input.method,
			processorRef: charged.processorRef,
			practiceId: input.practiceId,
		});
		await this.invoices.markPaid(invoice);
		await this.recordAudit('payment.recorded', 'payment', payment.id);
		return toPaymentRdo(payment);
	}

	async listClaims(): Promise<ClaimListRdo> {
		const invoices = await this.listVisibleInvoices();
		return {claims: invoices.map(toClaimRdo)};
	}

	private assertCanCreate(): void {
		const {role} = this.tenant.require();
		if (!canCreateInvoice(role)) {
			throw new PermissionDeniedError();
		}
	}

	private assertCanRecordPayment(): void {
		const {role} = this.tenant.require();
		if (!canRecordPayment(role)) {
			throw new PermissionDeniedError();
		}
	}

	private rejectMismatchedPracticeId(clientPracticeId: string | undefined): void {
		const {practiceId} = this.tenant.require();
		if (clientPracticeId !== undefined && clientPracticeId !== practiceId) {
			throw new TenantMismatchError();
		}
	}

	private async listVisibleInvoices(): Promise<Invoice[]> {
		const scope = this.tenant.require();
		const read = resolveBillingReadScope(scope.role);
		if (read === 'denied') {
			throw new PermissionDeniedError();
		}
		if (read.kind === 'own') {
			return this.invoices.list({portalUserId: scope.actorUserId});
		}
		return this.invoices.list();
	}

	private async loadVisibleInvoice(id: string): Promise<Invoice> {
		const scope = this.tenant.require();
		const read = resolveBillingReadScope(scope.role);
		if (read === 'denied') {
			throw new PermissionDeniedError();
		}
		const row = await this.invoices.getById(id);
		if (!row) {
			throw new InvoiceNotFoundError();
		}
		if (read.kind === 'own') {
			const patient = row.patient ?? (await this.patients.getById(row.patientId));
			if (!patient || patient.portalUserId !== scope.actorUserId) {
				throw new InvoiceNotFoundError();
			}
		}
		return row;
	}

	private async assertPatient(patientId: string): Promise<Patient> {
		const patient = await this.patients.getById(patientId);
		if (!patient) {
			throw new InvalidInvoicePatientError();
		}
		return patient;
	}

	private async recordAudit(action: string, resourceType: string, resourceId: string): Promise<void> {
		await this.audit.record({
			action,
			resourceType,
			resourceId,
			correlationId: getCorrelationId(this.request),
		});
	}
}

export function toInvoiceRdo(row: Invoice, now = new Date()): InvoiceRdo {
	return {
		id: row.id,
		practiceId: row.practiceId,
		patientId: row.patientId,
		patientName: row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : row.patientId,
		status: invoiceStatusForRdo(row.status, row.dueAt, now),
		amountCents: row.amountCents,
		currency: row.currency,
		issuedAt: row.issuedAt.toISOString(),
		dueAt: row.dueAt.toISOString(),
		lineItems: (row.lineItems ?? []).map((item) => ({
			description: item.description,
			amountCents: item.amountCents,
		})),
		synthetic: row.synthetic,
	};
}

export function invoiceStatusForRdo(
	status: Invoice['status'],
	dueAt: Date,
	now: Date,
): InvoiceRdoStatus {
	if (status === 'paid') {
		return 'paid';
	}
	if (dueAt.getTime() < now.getTime()) {
		return 'overdue';
	}
	return 'issued';
}

export function toPaymentRdo(row: Payment): PaymentRdo {
	return {
		id: row.id,
		invoiceId: row.invoiceId,
		practiceId: row.practiceId,
		amountCents: row.amountCents,
		method: row.method,
		processorRef: row.processorRef,
		status: row.status,
		synthetic: row.synthetic,
	};
}

export function toClaimRdo(invoice: Invoice): ClaimRdo {
	return {
		id: invoice.id,
		invoiceId: invoice.id,
		status: 'not_submitted',
		processor: 'edi837',
		synthetic: true,
	};
}
