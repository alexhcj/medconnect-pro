import {ApiError} from '@/lib/api/http';
import {fixtureInvoices, fixturePatients} from '@/lib/api/mocks/fixtures';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';
import type {Invoice} from '@/types/billing/invoice';

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
};
