'use client';

import {InvoiceList} from '@/components/billing/invoice-list';
import {BILLING_DEMO_NOTICE} from '@/components/billing/billing-demo-notice';
import {PaymentClaimsBoundaries} from '@/components/billing/payment-claims-boundaries';
import {canAccessBillingDashboard} from '@/lib/auth/billing-access';
import {useSessionStatus} from '@/lib/hooks/use-session';

export default function BillingPage() {
	const {session, isLoading: isSessionLoading} = useSessionStatus();
	const canAccess = !isSessionLoading && canAccessBillingDashboard(session?.userRole);

	return (
		<div>
			<h1 className="mb-2 text-2xl font-bold text-gray-900">Billing</h1>
			<p className="mb-6 text-sm text-gray-600">{BILLING_DEMO_NOTICE}</p>

			{isSessionLoading && (
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading billing</span>
				</div>
			)}

			{!isSessionLoading && !canAccess && (
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">You do not have access to the billing dashboard.</p>
				</div>
			)}

			{canAccess && (
				<>
					<InvoiceList />
					<PaymentClaimsBoundaries />
				</>
			)}
		</div>
	);
}
