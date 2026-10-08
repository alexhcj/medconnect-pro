'use client';

import {useState} from 'react';
import {RecordPaymentDialog} from '@/components/billing/record-payment-dialog';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {formatInvoiceAmount, PAYMENT_METHOD_LABELS} from '@/lib/billing/format';
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
	const unpaid = invoice !== undefined && invoice.status !== 'paid';
	const canSubmit = Boolean(invoice && unpaid && canRecord);

	return (
		<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Payment boundary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-gray-700">{paymentCopy(invoice, canRecord)}</p>
					{recorded && (
						<p className="text-sm text-gray-900">
							Payment recorded. {PAYMENT_METHOD_LABELS[recorded.method]}. Processor ref{' '}
							<span className="font-medium">{recorded.processorRef}</span>.{' '}
							{formatInvoiceAmount(recorded.amountCents)} synthetic only.
						</p>
					)}
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
					<p className="text-sm text-gray-700">
						Claims / EDI 837 is not connected. Claim status and denial workflow are out of this demo.
					</p>
				</CardContent>
			</Card>
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
