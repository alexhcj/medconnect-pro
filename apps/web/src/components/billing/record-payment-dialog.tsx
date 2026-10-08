'use client';

import {Dialog, DialogPanel, DialogTitle} from '@headlessui/react';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {ApiError} from '@/lib/api/http';
import {formatInvoiceAmount, PAYMENT_METHOD_LABELS} from '@/lib/billing/format';
import {useRecordPayment} from '@/lib/hooks/use-billing';
import type {Invoice} from '@/types/billing/invoice';
import {PAYMENT_METHODS, type Payment, type PaymentMethod} from '@/types/billing/payment';

function paymentErrorMessage(error: unknown): string {
	if (error instanceof ApiError && error.message) {
		return error.message;
	}
	return 'Unable to record this payment.';
}

export function RecordPaymentDialog({
	invoice,
	open,
	onClose,
	onRecorded,
}: {
	invoice: Invoice;
	open: boolean;
	onClose: () => void;
	onRecorded: (payment: Payment) => void;
}) {
	const [method, setMethod] = useState<PaymentMethod>('stripe');
	const recordPayment = useRecordPayment();

	function handleClose() {
		if (recordPayment.isPending) {
			return;
		}
		onClose();
	}

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
		>
			<div className="fixed inset-0 bg-black/40" aria-hidden />
			<DialogPanel className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 text-left shadow-xl">
				<DialogTitle className="text-lg font-semibold text-gray-900">Record payment</DialogTitle>
				<p className="mt-3 text-sm text-gray-700">
					{invoice.patientName} · {formatInvoiceAmount(invoice.amountCents, invoice.currency)}. Demo
					adapter only. Do not enter card or bank account numbers.
				</p>

				<fieldset className="mt-4" disabled={recordPayment.isPending}>
					<legend className="text-sm font-medium text-gray-900">Method</legend>
					<div className="mt-2 space-y-2">
						{PAYMENT_METHODS.map((value) => (
							<label key={value} className="flex h-10 items-center gap-3 text-sm text-gray-900">
								<input
									type="radio"
									name="payment-method"
									value={value}
									checked={method === value}
									onChange={() => setMethod(value)}
								/>
								{PAYMENT_METHOD_LABELS[value]}
							</label>
						))}
					</div>
				</fieldset>

				{recordPayment.isError && (
					<div className="mt-4 rounded-lg border border-red-200 bg-white p-3" role="alert">
						<p className="text-sm text-gray-700">{paymentErrorMessage(recordPayment.error)}</p>
					</div>
				)}

				<div className="mt-6 flex flex-wrap gap-3">
					<Button type="button" variant="outline" onClick={handleClose} disabled={recordPayment.isPending}>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => {
							recordPayment.mutate(
								{invoiceId: invoice.id, method},
								{
									onSuccess: (payment) => {
										onRecorded(payment);
										onClose();
									},
								},
							);
						}}
						disabled={recordPayment.isPending}
						isLoading={recordPayment.isPending}
					>
						Confirm payment
					</Button>
				</div>
			</DialogPanel>
		</Dialog>
	);
}
