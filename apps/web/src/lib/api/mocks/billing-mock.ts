import type {PaymentCreateBody} from '@/lib/api/billing-rdo';
import {ApiError} from '@/lib/api/http';
import {fixtureInvoices, fixturePatients} from '@/lib/api/mocks/fixtures';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';
import type {Claim} from '@/types/billing/claim';
import type {Invoice} from '@/types/billing/invoice';
import type {Payment} from '@/types/billing/payment';

function patientDisplayName(patientId: string): string {
	const patient = fixturePatients.find((item) => item.id === patientId);
	return patient ? `${patient.firstName} ${patient.lastName}` : patientId;
}

function withPatientName(invoice: Omit<Invoice, 'patientName'>): Invoice {
	return {
		...invoice,
		patientName: patientDisplayName(invoice.patientId),
		synthetic: true,
	};
}

const invoices: Invoice[] = structuredClone(fixtureInvoices).map(withPatientName);

async function withMock<T>(work: () => T, errorMessage: string): Promise<T> {
	await mockDelay();
	if (shouldSimulateError()) {
		mockLog('warn', errorMessage);
		throw new Error(errorMessage);
	}
	return work();
}

function notFound(): never {
	throw new ApiError('Invoice was not found.', 404, {code: 'NOT_FOUND'});
}

export const billingMockAPI = {
	listInvoices: async (): Promise<Invoice[]> =>
		withMock(() => invoices, 'Mock: Failed to load invoices'),

	getInvoice: async (invoiceId: string): Promise<Invoice> =>
		withMock(() => {
			const invoice = invoices.find((item) => item.id === invoiceId);
			if (!invoice) {
				notFound();
			}
			return invoice;
		}, 'Mock: Failed to load invoice'),

	recordPayment: async (body: PaymentCreateBody): Promise<Payment> =>
		withMock(() => {
			const invoice = invoices.find((item) => item.id === body.invoiceId);
			if (!invoice) {
				notFound();
			}
			if (invoice.status === 'paid') {
				throw new ApiError('This invoice has already been paid.', 409, {code: 'INVOICE_ALREADY_PAID'});
			}
			invoice.status = 'paid';
			return {
				id: `demo-payment-${invoice.id}`,
				invoiceId: invoice.id,
				practiceId: invoice.practiceId,
				amountCents: invoice.amountCents,
				method: body.method,
				processorRef: `demo_mock_${invoice.id}`,
				status: 'recorded',
				synthetic: true,
			};
		}, 'Mock: Failed to record payment'),

	listClaims: async (): Promise<Claim[]> =>
		withMock(
			() =>
				invoices.map((invoice) => ({
					id: invoice.id,
					invoiceId: invoice.id,
					status: 'not_submitted' as const,
					processor: 'edi837' as const,
					synthetic: true,
				})),
			'Mock: Failed to load claims',
		),
};
