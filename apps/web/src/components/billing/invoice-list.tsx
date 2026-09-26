'use client';

import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {useInvoices} from '@/lib/hooks/use-billing';
import {billingLoadErrorMessage} from '@/lib/billing/load-error';
import {formatInvoiceAmount, formatInvoiceDate, invoiceStatusLabel} from '@/lib/billing/format';

export function InvoiceList() {
	const invoices = useInvoices();

	return (
		<Card>
			<CardHeader>
				<p className="text-sm text-gray-600">Synthetic invoices for this demo. Not a real billing account.</p>
			</CardHeader>
			<CardContent>
				{invoices.isPending && (
					<div className="space-y-3" aria-busy="true">
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<span className="sr-only">Loading invoices</span>
					</div>
				)}

				{invoices.isError && (
					<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
						<p className="text-sm text-gray-700">
							{billingLoadErrorMessage(invoices.error, 'Unable to load invoices.')}
						</p>
						<Button type="button" className="mt-3" variant="outline" onClick={() => invoices.refetch()}>
							Retry
						</Button>
					</div>
				)}

				{!invoices.isPending && !invoices.isError && (invoices.data?.length ?? 0) === 0 && (
					<p className="text-sm text-gray-600">No invoices to display.</p>
				)}

				{!invoices.isPending && !invoices.isError && (invoices.data?.length ?? 0) > 0 && (
					<ul className="space-y-3" aria-label="Invoices">
						{invoices.data?.map((invoice) => (
							<li
								key={invoice.id}
								className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
							>
								<div>
									<p className="font-medium text-gray-900">{invoice.patientName}</p>
									<p className="mt-1 text-sm text-gray-700">{invoiceStatusLabel(invoice.status)}</p>
									<p className="mt-1 text-sm text-gray-600">Due {formatInvoiceDate(invoice.dueAt)}</p>
									<Link
										href={`/dashboard/billing/${invoice.id}`}
										aria-label={`View invoice ${invoice.id} for ${invoice.patientName}`}
										className="mt-2 inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
									>
										View invoice
									</Link>
								</div>
								<p className="text-sm font-medium text-gray-900">
									{formatInvoiceAmount(invoice.amountCents, invoice.currency)}
								</p>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
