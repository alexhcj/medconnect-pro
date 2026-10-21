import type {PaymentCreateBody} from '@/lib/api/billing-rdo';
import {ApiError} from '@/lib/api/http';
import {fixtureInvoices, fixturePatients} from '@/lib/api/mocks/fixtures';
import {readMockSession} from '@/lib/api/mocks/mock-session-store';
import {mockDelay, mockLog, shouldSimulateError} from '@/lib/api/mocks/runtime';
import type {PagedResult} from '@/types/admin/admin-list';
import type {Role} from '@/types/auth/roles';
import {
	BILLING_PAGE_SIZE,
	type ClaimListParams,
	type InvoiceListParams,
} from '@/types/billing/billing-list';
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

/**
 * Extra synthetic invoices so mock mode spans several pages. They sit before the fixture invoices in
 * time, so the fixture rows stay on page 1 of the default newest-first order. Kept here rather than in
 * the shared fixture `docs/mocks/invoices.json`.
 */
const GENERATED_INVOICE_COUNT = 30;
const GENERATED_STATUSES = ['paid', 'issued', 'overdue'] as const;
const GENERATED_FIRST_ISSUED_MS = Date.UTC(2026, 5, 30);

function generatedInvoices(): Array<Omit<Invoice, 'patientName'>> {
	return Array.from({length: GENERATED_INVOICE_COUNT}, (_, index) => {
		const issued = new Date(GENERATED_FIRST_ISSUED_MS - index * 3 * 86_400_000);
		const due = new Date(issued.getTime() + 14 * 86_400_000);
		const amountCents = 5000 + (index % 7) * 2500;
		return {
			id: `demo-invoice-${String(fixtureInvoices.length + index + 1).padStart(3, '0')}`,
			practiceId: 'demo-practice-001',
			patientId: `demo-patient-${String((index % 12) + 1).padStart(3, '0')}`,
			status: GENERATED_STATUSES[index % GENERATED_STATUSES.length],
			amountCents,
			currency: 'USD',
			issuedAt: issued.toISOString(),
			dueAt: due.toISOString(),
			lineItems: [{description: 'Office visit', amountCents}],
			synthetic: true,
		};
	});
}

const invoices: Invoice[] = structuredClone([...fixtureInvoices, ...generatedInvoices()]).map(
	withPatientName,
);

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

/** Newest issued first by default; ties break on id, as the API does. */
function sortInvoices(rows: Invoice[], sort: InvoiceListParams['sort'] = 'issued-desc'): Invoice[] {
	const direction = sort === 'issued-asc' ? 1 : -1;
	return rows.sort(
		(a, b) => direction * a.issuedAt.localeCompare(b.issuedAt) || a.id.localeCompare(b.id),
	);
}

function pageOf<T>(rows: T[], page: number): PagedResult<T> {
	const start = (page - 1) * BILLING_PAGE_SIZE;
	const hasMore = page * BILLING_PAGE_SIZE < rows.length;
	return {
		items: rows.slice(start, start + BILLING_PAGE_SIZE),
		total: rows.length,
		hasMore,
		nextPage: hasMore ? page + 1 : undefined,
	};
}

export const billingMockAPI = {
	listInvoices: async (params: InvoiceListParams = {page: 1}): Promise<PagedResult<Invoice>> =>
		withMock(() => {
			const rows = visibleInvoices(readScope().scope).filter(
				(invoice) => !params.status || invoice.status === params.status,
			);
			return pageOf(sortInvoices(rows, params.sort), params.page);
		}, 'Mock: Failed to load invoices'),

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

	listClaims: async (params: ClaimListParams = {page: 1}): Promise<PagedResult<Claim>> =>
		withMock(() => {
			const claims = sortInvoices(visibleInvoices(readScope().scope)).map((invoice) => ({
				id: invoice.id,
				invoiceId: invoice.id,
				status: 'not_submitted' as const,
				processor: 'edi837' as const,
				synthetic: true,
			}));
			return pageOf(claims, params.page);
		}, 'Mock: Failed to load claims'),
};
