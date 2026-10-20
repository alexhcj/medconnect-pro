import type {PaymentCreateBody} from '@/lib/api/billing-rdo';
import {ApiError} from '@/lib/api/http';
import {fixtureInvoices, fixturePatients} from '@/lib/api/mocks/fixtures';
import {readMockSession} from '@/lib/api/mocks/mock-session-store';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';
import type {Role} from '@/types/auth/roles';
import type {Claim} from '@/types/billing/claim';
import type {Invoice} from '@/types/billing/invoice';
import type {Payment} from '@/types/billing/payment';

/**
 * Mock stand-in for the API's `Patient.portalUserId`: portal user id to the fixture patient the
 * portal account is linked to. The mock IdP patient (`avery.quinn@synthetic.example`) reads the
 * fixture patient `demo-patient-001`.
 */
export const MOCK_PORTAL_PATIENT_BY_USER: Readonly<Record<string, string>> = {
	'77777777-7777-4777-8777-777777777777': 'demo-patient-001',
};

export type MockBillingScope = {kind: 'practice'} | {kind: 'own'; patientId: string | undefined};

/**
 * Mirrors Nest `resolveBillingReadScope` (apps/api/src/billing/billing-access.ts). The server
 * stays authoritative; this only keeps mock mode in parity with it. Tenant mismatch is not
 * mocked: the web client never sends a practice id (`PaymentCreateBody` has none).
 */
export function resolveMockBillingScope(
	role: Role,
	userId: string,
): MockBillingScope | 'denied' {
	if (role === 'NURSE') {
		return 'denied';
	}
	if (role === 'PATIENT') {
		return {kind: 'own', patientId: MOCK_PORTAL_PATIENT_BY_USER[userId]};
	}
	return {kind: 'practice'};
}

/** Mirrors Nest `canRecordPayment`: nurses and providers cannot record. */
export function canRecordMockPayment(role: Role): boolean {
	return role !== 'NURSE' && role !== 'PROVIDER';
}

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

function forbidden(): never {
	throw new ApiError('You do not have permission to perform this action', 403, {code: 'FORBIDDEN'});
}

function requireSession() {
	const session = readMockSession();
	if (!session) {
		throw new ApiError('Unauthorized', 401);
	}
	return session;
}

function readScope(): {role: Role; scope: MockBillingScope} {
	const session = requireSession();
	const scope = resolveMockBillingScope(session.userRole, session.userId);
	if (scope === 'denied') {
		forbidden();
	}
	return {role: session.userRole, scope};
}

function isVisible(scope: MockBillingScope, invoice: Invoice): boolean {
	return scope.kind === 'practice' || invoice.patientId === scope.patientId;
}

function visibleInvoices(scope: MockBillingScope): Invoice[] {
	// Copies, so an in-place status change is a new value to TanStack Query (structural sharing).
	return invoices.filter((invoice) => isVisible(scope, invoice)).map((invoice) => ({...invoice}));
}

export const billingMockAPI = {
	listInvoices: async (): Promise<Invoice[]> =>
		withMock(() => visibleInvoices(readScope().scope), 'Mock: Failed to load invoices'),

	getInvoice: async (invoiceId: string): Promise<Invoice> =>
		withMock(() => {
			const {scope} = readScope();
			const invoice = invoices.find((item) => item.id === invoiceId);
			if (!invoice || !isVisible(scope, invoice)) {
				notFound();
			}
			return {...invoice};
		}, 'Mock: Failed to load invoice'),

	recordPayment: async (body: PaymentCreateBody): Promise<Payment> =>
		withMock(() => {
			const {role, scope} = readScope();
			if (!canRecordMockPayment(role)) {
				forbidden();
			}
			const invoice = invoices.find((item) => item.id === body.invoiceId);
			if (!invoice || !isVisible(scope, invoice)) {
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
				visibleInvoices(readScope().scope).map((invoice) => ({
					id: invoice.id,
					invoiceId: invoice.id,
					status: 'not_submitted' as const,
					processor: 'edi837' as const,
					synthetic: true,
				})),
			'Mock: Failed to load claims',
		),
};
