'use client';

import {CircleCheck, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import {formatInvoiceAmount, PAYMENT_METHOD_LABELS} from '@/lib/billing/format';
import type {Payment} from '@/types/billing/payment';

export const PAYMENT_RECORDED_AUTO_DISMISS_MS = 6000;

/**
 * Transient confirmation shown only right after a demo payment is recorded (FE-042). Not stored:
 * it holds no inbox item and is gone on dismiss, timeout or reload. The timer pauses while the
 * pointer or keyboard focus is inside it.
 */
export function PaymentRecordedNotice({
	payment,
	onDismiss,
	autoDismissMs = PAYMENT_RECORDED_AUTO_DISMISS_MS,
}: {
	payment: Payment;
	onDismiss: () => void;
	autoDismissMs?: number;
}) {
	const [paused, setPaused] = useState(false);

	useEffect(() => {
		if (paused) {
			return;
		}
		const timer = setTimeout(onDismiss, autoDismissMs);
		return () => clearTimeout(timer);
	}, [paused, onDismiss, autoDismissMs, payment.id]);

	return (
		<div
			role="status"
			className="fixed inset-x-4 top-4 z-50 flex items-start gap-3 rounded-lg border border-border bg-surface py-2 pl-4 pr-1 shadow-lg md:inset-x-auto md:right-6 md:w-[360px]"
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			onFocus={() => setPaused(true)}
			onBlur={() => setPaused(false)}
		>
			<CircleCheck className="mt-2.5 h-5 w-5 shrink-0 text-success-strong" aria-hidden />
			<div className="min-w-0 flex-1 py-2.5">
				<p className="text-sm font-medium text-foreground">Payment recorded</p>
				<p className="mt-0.5 break-words text-sm text-foreground-secondary">
					{PAYMENT_METHOD_LABELS[payment.method]}. Processor ref {payment.processorRef}.{' '}
					{formatInvoiceAmount(payment.amountCents)} synthetic only.
				</p>
			</div>
			<button
				type="button"
				onClick={onDismiss}
				aria-label="Dismiss payment notification"
				className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				<X className="h-4 w-4" aria-hidden />
			</button>
		</div>
	);
}
