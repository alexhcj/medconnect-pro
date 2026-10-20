'use client';

import {useCallback, useState} from 'react';
import {ClaimsEnvelopeList} from '@/components/billing/claims-envelope-list';
import {PaymentRecordedNotice} from '@/components/billing/payment-recorded-notice';
import {RecordPaymentDialog} from '@/components/billing/record-payment-dialog';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import type {Invoice} from '@/types/billing/invoice';
import type {Payment} from '@/types/billing/payment';

function paymentCopy(invoice: Invoice | undefined, canRecord: boolean): string {
	if (!invoice) {
		return 'Open an unpaid invoice to record a demo payment. This demo does not collect card numbers.';
	}
	if (invoice.status === 'paid') {
		return 'This invoice is already paid. Hosted Stripe is not connected.';
	}
	if (!canRecord) {
		return 'Providers can review invoices. Recording a payment requires a practice admin or receptionist.';
	}
	return 'Demo Stripe/ACH adapter. Records a synthetic payment. Does not process card numbers or originate ACH.';
}

export function PaymentClaimsBoundaries({
	invoice,
	canRecord = false,
}: {
	invoice?: Invoice;
	canRecord?: boolean;
}) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [recorded, setRecorded] = useState<Payment | null>(null);
	const dismissRecorded = useCallback(() => setRecorded(null), []);
	const unpaid = invoice !== undefined && invoice.status !== 'paid';
	const canSubmit = Boolean(invoice && unpaid && canRecord);

	return (
		<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
			<Card className="self-start">
				<CardHeader>
					<CardTitle>Payment boundary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-gray-700">{paymentCopy(invoice, canRecord)}</p>
					<Button type="button" disabled={!canSubmit} onClick={() => setDialogOpen(true)}>
						Record payment
					</Button>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Claims boundary</CardTitle>
				</CardHeader>
				<CardContent>
					<ClaimsEnvelopeList />
				</CardContent>
			</Card>
			{recorded && <PaymentRecordedNotice payment={recorded} onDismiss={dismissRecorded} />}
			{invoice && (
				<RecordPaymentDialog
					invoice={invoice}
					open={dialogOpen}
					onClose={() => setDialogOpen(false)}
					onRecorded={setRecorded}
				/>
			)}
		</div>
	);
}
