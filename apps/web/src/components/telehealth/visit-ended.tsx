'use client';

import Link from 'next/link';
import {CircleCheck} from 'lucide-react';
import {visitDurationMinutes} from '@/components/telehealth/visit-wrap-up';
import {buttonVariants} from '@/components/ui/button';
import {formatDate, formatTime, formatZone} from '@/lib/format/date';
import {cn} from '@/lib/utils/utils';
import type {Appointment} from '@/types/medical/appointment';
import type {TelehealthSession} from '@/types/medical/telehealth-session';

/**
 * Patient confirmation after a visit (TH-09). The follow-up card appears only when a real next
 * appointment exists; nothing is invented.
 */
export function VisitEnded({
	session,
	nextAppointment,
}: {
	session: TelehealthSession;
	nextAppointment?: Appointment;
}) {
	const minutes = visitDurationMinutes(session.joinedAt, session.endedAt);

	return (
		<section
			aria-labelledby="visit-ended-heading"
			className="mx-auto w-full max-w-md space-y-5 rounded-lg border border-border bg-surface p-5"
		>
			<header className="space-y-1 text-center">
				<CircleCheck aria-hidden="true" className="mx-auto size-10 text-brand" />
				<h2 id="visit-ended-heading" className="text-xl font-semibold text-foreground">
					Your visit has ended
				</h2>
				<p className="text-sm text-foreground-secondary">
					{session.providerName}
					{minutes !== undefined ? ` · ${minutes} min` : ''}
				</p>
				<p className="text-sm text-foreground-secondary">{formatDate(session.endedAt ?? session.end)} · Video visit</p>
			</header>

			{nextAppointment && (
				<div className="rounded-lg border border-border p-4">
					<h3 className="text-base font-semibold text-foreground">Follow-up appointment</h3>
					<p className="mt-1 text-sm text-foreground">
						{formatDate(nextAppointment.start)}, {formatTime(nextAppointment.start)}
					</p>
					<p className="text-sm text-foreground-secondary">{nextAppointment.providerName} · Video visit</p>
					<p className="text-xs text-foreground-muted">Your local time ({formatZone(nextAppointment.start)})</p>
				</div>
			)}

			<Link
				href="/dashboard/appointments"
				className={cn(buttonVariants({variant: 'default'}), 'min-h-11 w-full')}
			>
				Back to appointments
			</Link>
			<p className="text-center text-xs text-foreground-muted">Demo · synthetic data</p>
		</section>
	);
}
