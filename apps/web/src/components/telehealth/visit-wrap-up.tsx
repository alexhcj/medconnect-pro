'use client';

import Link from 'next/link';
import {ROLE_TAG_LABEL} from '@/components/telehealth/call-stage/participant-tile';
import {buttonVariants} from '@/components/ui/button';
import {formatDate, formatTime} from '@/lib/format/date';
import {NETWORK_LEVEL_LABEL} from '@/lib/telehealth/call-participants';
import type {CallSummary} from '@/lib/telehealth/call-summary';
import {cn} from '@/lib/utils/utils';
import type {TelehealthSession} from '@/types/medical/telehealth-session';

/** Whole minutes between join and end, or undefined when either time is missing. */
export function visitDurationMinutes(joinedAt?: string, endedAt?: string): number | undefined {
	if (!joinedAt || !endedAt) {
		return undefined;
	}
	const ms = Date.parse(endedAt) - Date.parse(joinedAt);
	return Number.isFinite(ms) && ms >= 0 ? Math.max(1, Math.round(ms / 60_000)) : undefined;
}

function Stat({label, value, note}: {label: string; value: string; note?: string}) {
	return (
		<div>
			<dt className="text-sm text-foreground-secondary">{label}</dt>
			<dd className="mt-1 text-lg font-semibold text-foreground">{value}</dd>
			{note && <p className="mt-0.5 text-xs text-foreground-muted">{note}</p>}
		</div>
	);
}

/**
 * Provider wrap-up (TH-09), inside the standard dashboard shell. Duration comes from Nest
 * (`joinedAt` to `endedAt`). "Seen in this call" and connection quality come from this browser only
 * and are labeled that way; they are hidden when this browser recorded nothing.
 */
export function VisitWrapUp({
	session,
	summary,
	followUpHref,
}: {
	session: TelehealthSession;
	summary?: CallSummary;
	followUpHref: string;
}) {
	const minutes = visitDurationMinutes(session.joinedAt, session.endedAt);
	const seen = summary?.roles.map((role) => ROLE_TAG_LABEL[role] ?? role).join(', ');
	const quality =
		summary && summary.worstNetwork !== 'unknown' ? NETWORK_LEVEL_LABEL[summary.worstNetwork] : undefined;
	const dateText = formatDate(session.endedAt ?? session.end);

	return (
		<section
			aria-labelledby="visit-wrap-up-heading"
			className="space-y-6 rounded-lg border border-border bg-surface p-6"
		>
			<header className="space-y-1">
				<p className="inline-flex items-center rounded-md bg-subtle px-2 py-0.5 text-xs font-medium text-foreground">
					Visit ended
				</p>
				<h2 id="visit-wrap-up-heading" className="text-xl font-semibold text-foreground">
					Visit wrap-up · {session.patientName}
				</h2>
				<p className="text-sm text-foreground-secondary">{dateText} · Video visit</p>
			</header>

			<dl className="grid gap-6 sm:grid-cols-2">
				{minutes !== undefined && <Stat label="Duration" value={`${minutes} min`} />}
				{seen ? (
					<Stat label="Seen in this call" value={seen} note="As seen from your call on this device." />
				) : null}
				{session.endedAt && <Stat label="Ended" value={formatTime(session.endedAt)} />}
				{quality && <Stat label="Connection quality" value={quality} note="Your connection, from this device." />}
			</dl>

			<div className="rounded-lg border border-border p-4">
				<h3 className="text-base font-semibold text-foreground">Follow-up</h3>
				<p className="mt-1 text-sm text-foreground-secondary">
					Book the next visit for {session.patientName} in Appointments.
				</p>
				<Link href={followUpHref} className={cn(buttonVariants({variant: 'default'}), 'mt-3 min-h-11')}>
					Book follow-up
				</Link>
			</div>

			<p className="text-xs text-foreground-muted">
				All clinical details on this screen are synthetic and for demonstration only.
			</p>
		</section>
	);
}
