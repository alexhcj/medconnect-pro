'use client';

import {
	ListNotice,
	ListSkeleton,
	useFocusHeadingOnPageChange,
} from '@/components/admin/admin-list-states';
import {Pagination} from '@/components/ui/pagination';
import {pageRange} from '@/lib/admin/list-params';
import {useListUrlState} from '@/lib/admin/use-list-url-state';
import {billingLoadErrorMessage} from '@/lib/billing/load-error';
import {claimProcessorLabel, claimStatusLabel} from '@/lib/billing/format';
import {useClaims} from '@/lib/hooks/use-billing';
import {BILLING_PAGE_SIZE} from '@/types/billing/billing-list';

export const CLAIMS_ENVELOPE_NOTICE =
	'Labeled EDI 837 envelopes derived from visible invoices. Not claim submission, X12, or denial workflow.';

const NO_FILTERS: readonly string[] = [];

export function ClaimsEnvelopeList({enabled = true}: {enabled?: boolean}) {
	// Claims page on their own `claimsPage` param, so paging them never moves the invoice list.
	const {page, setPage} = useListUrlState('claims', NO_FILTERS);
	const claims = useClaims({page}, enabled);
	const focusRef = useFocusHeadingOnPageChange<HTMLParagraphElement>(page);

	const data = claims.data;
	const isBusy = claims.isPlaceholderData;
	const range = pageRange(page, data?.items.length ?? 0, BILLING_PAGE_SIZE);

	return (
		<div className="space-y-3">
			<p ref={focusRef} tabIndex={-1} className="text-sm text-gray-700 focus:outline-none">
				{CLAIMS_ENVELOPE_NOTICE}
			</p>

			{claims.isPending && <ListSkeleton label="Loading claims envelopes" rows={2} />}

			{claims.isError && (
				<ListNotice
					tone="error"
					message={billingLoadErrorMessage(claims.error, 'Unable to load claims envelopes.')}
					action={{label: 'Retry', onClick: () => claims.refetch()}}
				/>
			)}

			{!claims.isPending && !claims.isError && data && data.total === 0 && (
				<ListNotice message="No claims envelopes for visible invoices." />
			)}

			{!claims.isPending && !claims.isError && data && data.total > 0 && data.items.length === 0 && (
				<ListNotice
					message={`Page ${page} is past the end of the results (${data.total} claims envelopes).`}
					action={{label: 'Back to first page', onClick: () => setPage(1)}}
				/>
			)}

			{!claims.isPending && !claims.isError && data && data.items.length > 0 && (
				<>
					<p aria-live="polite" className="text-sm text-gray-600">
						Showing {range.first}–{range.last} of {data.total} claims envelopes
					</p>
					<ul
						className={`space-y-2 ${isBusy ? 'opacity-50' : ''}`}
						aria-label="Claims envelopes"
						aria-busy={isBusy || undefined}
					>
						{data.items.map((claim) => (
							<li key={claim.id} className="rounded-lg border border-gray-200 p-3">
								<p className="text-sm font-medium text-gray-900">Invoice {claim.invoiceId}</p>
								<p className="mt-1 text-sm text-gray-700">{claimStatusLabel(claim.status)}</p>
								<p className="mt-1 text-sm text-gray-600">{claimProcessorLabel(claim.processor)}</p>
								{claim.synthetic && <p className="mt-1 text-sm text-gray-600">Synthetic</p>}
							</li>
						))}
					</ul>
					{data.total > BILLING_PAGE_SIZE && (
						<Pagination
							container
							label="Claims envelopes"
							page={page}
							total={data.total}
							pageSize={BILLING_PAGE_SIZE}
							onPageChange={setPage}
							disabled={isBusy}
						/>
					)}
				</>
			)}
		</div>
	);
}
