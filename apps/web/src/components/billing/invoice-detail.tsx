'use client';

import type {ReactNode} from 'react';
import Link from 'next/link';
import {BILLING_DEMO_NOTICE} from '@/components/billing/billing-demo-notice';
import {PaymentClaimsBoundaries} from '@/components/billing/payment-claims-boundaries';
import {Button} from '@/components/ui/button';
import {canAccessBillingDashboard} from '@/lib/auth/billing-access';
import {billingLoadErrorMessage} from '@/lib/billing/load-error';
import {formatInvoiceAmount, formatInvoiceDate, invoiceStatusLabel} from '@/lib/billing/format';
import {useInvoice} from '@/lib/hooks/use-billing';
import {useSessionStatus} from '@/lib/hooks/use-session';
import type {Invoice} from '@/types/billing/invoice';

function InvoiceDetailBody({invoice}: {invoice: Invoice}) {
	return (
		<div className="space-y-6">
			<section className="rounded-lg border border-gray-200 bg-white p-4" aria-labelledby="invoice-details-heading">
				<h2 id="invoice-details-heading" className="mb-3 text-lg font-semibold text-gray-900">
					Details
				</h2>
				<dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div>
						<dt className="text-sm text-gray-600">Invoice</dt>
						<dd className="text-sm font-medium text-gray-900">{invoice.id}</dd>
					</div>
					<div>
						<dt className="text-sm text-gray-600">Patient</dt>
						<dd className="text-sm font-medium text-gray-900">{invoice.patientName}</dd>
					</div>
					<div>
						<dt className="text-sm text-gray-600">Status</dt>
						<dd className="text-sm font-medium text-gray-900">{invoiceStatusLabel(invoice.status)}</dd>
					</div>
					<div>
						<dt className="text-sm text-gray-600">Amount</dt>
						<dd className="text-sm font-medium text-gray-900">
							{formatInvoiceAmount(invoice.amountCents, invoice.currency)}
						</dd>
					</div>
					<div>
						<dt className="text-sm text-gray-600">Issued on</dt>
						<dd className="text-sm font-medium text-gray-900">{formatInvoiceDate(invoice.issuedAt)}</dd>
					</div>
					<div>
						<dt className="text-sm text-gray-600">Due on</dt>
						<dd className="text-sm font-medium text-gray-900">{formatInvoiceDate(invoice.dueAt)}</dd>
					</div>
				</dl>
			</section>

			<section className="rounded-lg border border-gray-200 bg-white p-4" aria-labelledby="invoice-line-items-heading">
				<h2 id="invoice-line-items-heading" className="mb-3 text-lg font-semibold text-gray-900">
					Line items
				</h2>
				<ul className="space-y-2" aria-label="Line items">
					{invoice.lineItems.map((item) => (
						<li
							key={`${item.description}-${item.amountCents}`}
							className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
						>
							<span className="text-sm text-gray-900">{item.description}</span>
							<span className="text-sm text-gray-700">
								{formatInvoiceAmount(item.amountCents, invoice.currency)}
							</span>
						</li>
					))}
				</ul>
			</section>

			<PaymentClaimsBoundaries />
		</div>
	);
}

function DetailChrome({children}: {children: ReactNode}) {
	return (
		<div>
			<Link
				href="/dashboard/billing"
				className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
			>
				Back to billing
			</Link>
			<div className="mt-4">{children}</div>
		</div>
	);
}

export function InvoiceDetail({invoiceId}: {invoiceId: string}) {
	const {session: authSession, isLoading: isAuthLoading} = useSessionStatus();
	const canAccess = !isAuthLoading && canAccessBillingDashboard(authSession?.userRole);
	const invoice = useInvoice(invoiceId, canAccess);

	if (isAuthLoading) {
		return (
			<DetailChrome>
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading invoice</span>
				</div>
			</DetailChrome>
		);
	}

	if (!canAccess) {
		return (
			<DetailChrome>
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">You do not have access to the billing dashboard.</p>
				</div>
			</DetailChrome>
		);
	}

	return (
		<DetailChrome>
			<h1 className="mb-2 text-2xl font-bold text-gray-900">Invoice</h1>
			<p className="mb-6 text-sm text-gray-600">{BILLING_DEMO_NOTICE}</p>

			{invoice.isPending && (
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading invoice</span>
				</div>
			)}

			{invoice.isError && (
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">
						{billingLoadErrorMessage(invoice.error, 'Unable to load this invoice.')}
					</p>
					<Button type="button" className="mt-3" variant="outline" onClick={() => invoice.refetch()}>
						Retry
					</Button>
				</div>
			)}

			{!invoice.isPending && !invoice.isError && invoice.data && (
				<InvoiceDetailBody invoice={invoice.data} />
			)}
		</DetailChrome>
	);
}
