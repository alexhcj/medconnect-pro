'use client';

import Link from 'next/link';
import {
	ListNotice,
	ListSkeleton,
	useFocusHeadingOnPageChange,
} from '@/components/admin/admin-list-states';
import {SelectField} from '@/components/admin/list-filter-fields';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Pagination} from '@/components/ui/pagination';
import {pageRange} from '@/lib/admin/list-params';
import {useListUrlState} from '@/lib/admin/use-list-url-state';
import {billingLoadErrorMessage} from '@/lib/billing/load-error';
import {
	formatInvoiceAmount,
	formatInvoiceDate,
	invoiceStatusLabel,
	invoiceStatusTextClass,
} from '@/lib/billing/format';
import {parseInvoiceSort, parseInvoiceStatus} from '@/lib/billing/list-params';
import {useInvoices} from '@/lib/hooks/use-billing';
import {BILLING_PAGE_SIZE} from '@/types/billing/billing-list';
import {INVOICE_STATUSES} from '@/types/billing/invoice';

const FILTER_NAMES = ['status', 'sort'] as const;

const STATUS_LABELS = Object.fromEntries(
	INVOICE_STATUSES.map((status) => [status, invoiceStatusLabel(status)]),
);

/** Newest first is the API default, so it is the "all" entry and never appears in the URL. */
const SORT_OPTIONS = ['issued-asc'] as const;
const SORT_LABELS = {'issued-asc': 'Oldest issued first'};

export function InvoiceList() {
	const {page, filters, setPage, setFilters} = useListUrlState('invoices', FILTER_NAMES);
	const status = parseInvoiceStatus(filters.status);
	const sort = parseInvoiceSort(filters.sort) === 'issued-asc' ? 'issued-asc' : undefined;
	const invoices = useInvoices({page, status, sort});
	const headingRef = useFocusHeadingOnPageChange(page);

	const hasFilters = Boolean(status || sort);
	const data = invoices.data;
	const showFilters = hasFilters || !data || data.total > 0;
	const isBusy = invoices.isPlaceholderData;
	const range = pageRange(page, data?.items.length ?? 0, BILLING_PAGE_SIZE);

	function applyFilters(patch: {status?: string; sort?: string}) {
		setFilters({status, sort, ...patch});
	}

	return (
		<Card>
			<CardHeader>
				<h2
					ref={headingRef}
					tabIndex={-1}
					className="text-lg font-semibold text-gray-900 focus:outline-none"
				>
					Invoices
				</h2>
				<p className="text-sm text-gray-600">Synthetic invoices for this demo. Not a real billing account.</p>
			</CardHeader>
			<CardContent className="space-y-3">
				{showFilters && (
					<div
						role="group"
						aria-label="Invoice filters"
						className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start"
					>
						<SelectField
							label="Status"
							value={status ?? ''}
							options={INVOICE_STATUSES}
							optionLabels={STATUS_LABELS}
							allLabel="All statuses"
							disabled={invoices.isPending}
							className="md:w-56"
							onChange={(value) => applyFilters({status: value})}
						/>
						<SelectField
							label="Sort"
							value={sort ?? ''}
							options={SORT_OPTIONS}
							optionLabels={SORT_LABELS}
							allLabel="Newest issued first"
							disabled={invoices.isPending}
							className="md:w-56"
							onChange={(value) => applyFilters({sort: value})}
						/>
						{hasFilters && (
							<Button
								type="button"
								variant="ghost"
								size="lg"
								className="md:mt-6"
								onClick={() => setFilters({})}
							>
								Clear filters
							</Button>
						)}
					</div>
				)}

				{invoices.isPending && <ListSkeleton label="Loading invoices" rows={3} />}

				{invoices.isError && (
					<ListNotice
						tone="error"
						message={billingLoadErrorMessage(invoices.error, 'Unable to load invoices.')}
						action={{label: 'Retry', onClick: () => invoices.refetch()}}
					/>
				)}

				{!invoices.isPending && !invoices.isError && data && data.total === 0 && (
					<ListNotice
						message={hasFilters ? 'No invoices match these filters.' : 'No invoices to display.'}
						action={hasFilters ? {label: 'Clear filters', onClick: () => setFilters({})} : undefined}
					/>
				)}

				{!invoices.isPending && !invoices.isError && data && data.total > 0 && data.items.length === 0 && (
					<ListNotice
						message={`Page ${page} is past the end of the results (${data.total} invoices).`}
						action={{label: 'Back to first page', onClick: () => setPage(1)}}
					/>
				)}

				{!invoices.isPending && !invoices.isError && data && data.items.length > 0 && (
					<>
						<p aria-live="polite" className="text-sm text-gray-600">
							Showing {range.first}–{range.last} of {data.total} invoices ·{' '}
							{sort === 'issued-asc' ? 'oldest' : 'newest'} first
						</p>
						<ul
							className={`space-y-3 ${isBusy ? 'opacity-50' : ''}`}
							aria-label="Invoices"
							aria-busy={isBusy || undefined}
						>
							{data.items.map((invoice) => (
								<li
									key={invoice.id}
									className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
								>
									<div>
										<p className="font-medium text-gray-900">{invoice.patientName}</p>
										<p className={`mt-1 text-sm font-medium ${invoiceStatusTextClass(invoice.status)}`}>
											{invoiceStatusLabel(invoice.status)}
										</p>
										<p className="mt-1 text-sm text-gray-600">Due {formatInvoiceDate(invoice.dueAt)}</p>
										<Link
											href={`/dashboard/billing/${invoice.id}`}
											aria-label={`View invoice ${invoice.id} for ${invoice.patientName}`}
											className="mt-2 inline-flex h-11 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
						{data.total > BILLING_PAGE_SIZE && (
							<Pagination
								label="Invoices"
								page={page}
								total={data.total}
								pageSize={BILLING_PAGE_SIZE}
								onPageChange={setPage}
								disabled={isBusy}
							/>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
