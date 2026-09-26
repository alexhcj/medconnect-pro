import {describe, expect, it, vi} from 'vitest';
import type {AuditEventRepository} from '../audit/audit-event.repository.js';
import {PermissionDeniedError} from '../identity/auth.errors.js';
import type {Invoice} from '../persistence/entities/invoice.entity.js';
import type {Patient} from '../persistence/entities/patient.entity.js';
import type {Payment} from '../persistence/entities/payment.entity.js';
import type {PatientRepository} from '../practice/patient.repository.js';
import {TenantContext} from '../tenancy/tenant-context.js';
import type {PracticeRole} from '../tenancy/practice-role.js';
import {InvoiceAlreadyPaidError, InvoiceNotFoundError} from './billing.errors.js';
import {BillingService} from './billing.service.js';
import type {InvoiceRepository} from './invoice.repository.js';
import type {PaymentGateway} from './payment-gateway.js';
import type {PaymentRepository} from './payment.repository.js';

const actorId = '00000000-0000-4000-8000-000000000010';
const otherId = '00000000-0000-4000-8000-000000000011';
const patientId = '00000000-0000-4000-8000-0000000000aa';
const practiceId = '00000000-0000-4000-8000-000000000001';
const invoiceId = '00000000-0000-4000-8000-0000000000cc';
const paymentId = '00000000-0000-4000-8000-0000000000dd';

function patientRow(overrides: Partial<Patient> = {}): Patient {
	return {
		id: patientId,
		practiceId,
		firstName: 'Avery',
		lastName: 'Quinn',
		portalUserId: actorId,
		...overrides,
	} as Patient;
}

function invoiceRow(overrides: Partial<Invoice> = {}): Invoice {
	return {
		id: invoiceId,
		practiceId,
		patientId,
		status: 'issued',
		amountCents: 15000,
		currency: 'USD',
		issuedAt: new Date('2026-09-01T00:00:00.000Z'),
		dueAt: new Date('2026-09-15T00:00:00.000Z'),
		synthetic: true,
		patient: patientRow(),
		lineItems: [{description: 'Office visit', amountCents: 15000}],
		...overrides,
	} as Invoice;
}

function paymentRow(): Payment {
	return {
		id: paymentId,
		practiceId,
		invoiceId,
		amountCents: 15000,
		method: 'stripe',
		processorRef: 'demo_ref',
		status: 'recorded',
		synthetic: true,
	} as Payment;
}

function harness(role: PracticeRole, userId = actorId) {
	const tenant = new TenantContext();
	tenant.set({practiceId, actorUserId: userId, role});
	const invoices = {
		list: vi.fn().mockResolvedValue([invoiceRow()]),
		getById: vi.fn().mockResolvedValue(invoiceRow()),
		create: vi.fn().mockResolvedValue(invoiceRow()),
		markPaid: vi.fn().mockResolvedValue(invoiceRow({status: 'paid'})),
	};
	const payments = {
		create: vi.fn().mockResolvedValue(paymentRow()),
	};
	const patients = {
		getById: vi.fn().mockResolvedValue(patientRow()),
	};
	const audit = {
		record: vi.fn().mockResolvedValue({}),
	};
	const gateway: PaymentGateway = {
		charge: vi.fn().mockResolvedValue({processorRef: 'demo_ref', status: 'recorded'}),
	};
	const request = {correlationId: 'cid-billing'} as never;
	const service = new BillingService(
		invoices as unknown as InvoiceRepository,
		payments as unknown as PaymentRepository,
		patients as unknown as PatientRepository,
		audit as unknown as AuditEventRepository,
		tenant,
		gateway,
		request,
	);
	return {service, invoices, payments, patients, audit, gateway};
}

const createBody = {
	patientId,
	dueAt: '2026-09-15T00:00:00.000Z',
	lineItems: [{description: 'Office visit', amountCents: 15000}],
};

describe('BillingService', () => {
	it('creates an invoice for a receptionist, emits audit, and omits amounts from the audit payload', async () => {
		const desk = harness('RECEPTIONIST');
		const created = await desk.service.createInvoice(createBody);
		expect(created.synthetic).toBe(true);
		expect(created.amountCents).toBe(15000);
		expect(desk.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'invoice.created',
				resourceType: 'invoice',
				resourceId: invoiceId,
				correlationId: 'cid-billing',
			}),
		);
		expect(JSON.stringify(desk.audit.record.mock.calls[0])).not.toMatch(/15000|Office visit|Quinn/);
	});

	it('denies nurse reads and writes on the practice billing surface', async () => {
		const nurse = harness('NURSE');
		await expect(nurse.service.listInvoices()).rejects.toBeInstanceOf(PermissionDeniedError);
		await expect(nurse.service.getInvoice(invoiceId)).rejects.toBeInstanceOf(PermissionDeniedError);
		await expect(nurse.service.createInvoice(createBody)).rejects.toBeInstanceOf(PermissionDeniedError);
		await expect(
			nurse.service.recordPayment({invoiceId, method: 'stripe'}),
		).rejects.toBeInstanceOf(PermissionDeniedError);
		await expect(nurse.service.listClaims()).rejects.toBeInstanceOf(PermissionDeniedError);
		expect(nurse.invoices.create).not.toHaveBeenCalled();
		expect(nurse.gateway.charge).not.toHaveBeenCalled();
	});

	it('lets a portal user pay their own issued invoice and not another patient’s', async () => {
		const own = harness('PATIENT');
		const paid = await own.service.recordPayment({invoiceId, method: 'ach'});
		expect(paid.processorRef).toBe('demo_ref');
		expect(own.gateway.charge).toHaveBeenCalledWith({
			invoiceId,
			amountCents: 15000,
			method: 'ach',
		});
		expect(JSON.stringify(own.gateway.charge.mock.calls)).not.toMatch(/cardNumber|cvv|PAN/i);
		expect(own.audit.record).toHaveBeenCalledWith(
			expect.objectContaining({action: 'payment.recorded', resourceType: 'payment'}),
		);

		const other = harness('PATIENT');
		other.invoices.getById.mockResolvedValue(
			invoiceRow({patient: patientRow({portalUserId: otherId})}),
		);
		await expect(other.service.getInvoice(invoiceId)).rejects.toBeInstanceOf(InvoiceNotFoundError);
		await expect(
			other.service.recordPayment({invoiceId, method: 'stripe'}),
		).rejects.toBeInstanceOf(InvoiceNotFoundError);
		expect(other.gateway.charge).not.toHaveBeenCalled();
	});

	it('rejects a second payment on a paid invoice without charging', async () => {
		const desk = harness('RECEPTIONIST');
		desk.invoices.getById.mockResolvedValue(invoiceRow({status: 'paid'}));
		await expect(
			desk.service.recordPayment({invoiceId, method: 'stripe'}),
		).rejects.toBeInstanceOf(InvoiceAlreadyPaidError);
		expect(desk.gateway.charge).not.toHaveBeenCalled();
	});

	it('denies provider invoice create and payment', async () => {
		const provider = harness('PROVIDER');
		const listed = await provider.service.listInvoices();
		expect(listed.invoices).toHaveLength(1);
		await expect(provider.service.createInvoice(createBody)).rejects.toBeInstanceOf(
			PermissionDeniedError,
		);
		await expect(
			provider.service.recordPayment({invoiceId, method: 'stripe'}),
		).rejects.toBeInstanceOf(PermissionDeniedError);
	});
});
