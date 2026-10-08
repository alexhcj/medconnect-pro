'use client';

import {Button} from '@/components/ui/button';
import {billingLoadErrorMessage} from '@/lib/billing/load-error';
import {claimProcessorLabel, claimStatusLabel} from '@/lib/billing/format';
import {useClaims} from '@/lib/hooks/use-billing';

export const CLAIMS_ENVELOPE_NOTICE =
	'Labeled EDI 837 envelopes derived from visible invoices. Not claim submission, X12, or denial workflow.';

export function ClaimsEnvelopeList({enabled = true}: {enabled?: boolean}) {
	const claims = useClaims(enabled);

	return (
		<div className="space-y-3">
			<p className="text-sm text-gray-700">{CLAIMS_ENVELOPE_NOTICE}</p>

			{claims.isPending && (
				<div className="space-y-2" aria-busy="true">
					<div className="h-16 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading claim envelopes</span>
				</div>
			)}

			{claims.isError && (
				<div className="rounded-lg border border-red-200 bg-white p-3" role="alert">
					<p className="text-sm text-gray-700">
						{billingLoadErrorMessage(claims.error, 'Unable to load claim envelopes.')}
					</p>
					<Button type="button" className="mt-3" variant="outline" onClick={() => claims.refetch()}>
						Retry
					</Button>
				</div>
			)}

			{!claims.isPending && !claims.isError && (claims.data?.length ?? 0) === 0 && (
				<p className="text-sm text-gray-600">No claim envelopes for visible invoices.</p>
			)}

			{!claims.isPending && !claims.isError && (claims.data?.length ?? 0) > 0 && (
				<ul className="space-y-2" aria-label="Claim envelopes">
					{claims.data?.map((claim) => (
						<li key={claim.id} className="rounded-lg border border-gray-200 p-3">
							<p className="text-sm font-medium text-gray-900">Invoice {claim.invoiceId}</p>
							<p className="mt-1 text-sm text-gray-700">{claimStatusLabel(claim.status)}</p>
							<p className="mt-1 text-sm text-gray-600">{claimProcessorLabel(claim.processor)}</p>
							{claim.synthetic && <p className="mt-1 text-sm text-gray-600">Synthetic</p>}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
