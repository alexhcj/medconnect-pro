'use client';

import {Lock, Video} from 'lucide-react';
import {NETWORK_LEVEL_LABEL, type NetworkLevel} from '@/lib/telehealth/call-participants';
import {cn} from '@/lib/utils/utils';

/** SEC-013 scope 10: "encrypted connection" and "not recorded". Never "secure" or "end-to-end". */
export const STAGE_ENCRYPTION_NOTE = 'Encrypted connection · This visit is not recorded';

const BAR_COUNT = 3;
const LIT_BARS: Record<NetworkLevel, number> = {good: 3, fair: 2, poor: 1, unknown: 0};
const BAR_COLOR: Record<NetworkLevel, string> = {
	good: 'bg-green-400',
	fair: 'bg-amber-300',
	poor: 'bg-red-400',
	unknown: 'bg-(--color-stage-border-strong)',
};

export function NetworkIndicator({level, className}: {level: NetworkLevel; className?: string}) {
	const lit = LIT_BARS[level];
	return (
		<span className={cn('flex items-center gap-2 text-sm text-(--color-stage-text-muted)', className)}>
			<span aria-hidden="true" className="flex h-4 items-end gap-0.5">
				{Array.from({length: BAR_COUNT}, (_, index) => (
					<span
						key={index}
						className={cn(
							'w-1 rounded-sm',
							index === 0 ? 'h-1.5' : index === 1 ? 'h-2.5' : 'h-4',
							index < lit ? BAR_COLOR[level] : 'bg-(--color-stage-border)',
						)}
					/>
				))}
			</span>
			<span>
				<span className="sr-only">Network quality: </span>
				{NETWORK_LEVEL_LABEL[level]}
			</span>
		</span>
	);
}

/**
 * Visit title, Live status, elapsed time, network quality and the demo-data badge. The timer is
 * `role="timer"` with polling announcements off, so it is not read out every second.
 */
export function StageHeader({
	title,
	elapsed,
	networkLevel,
	statusLabel = 'Live',
	showLive = true,
}: {
	title: string;
	elapsed: string;
	networkLevel: NetworkLevel;
	statusLabel?: string;
	showLive?: boolean;
}) {
	return (
		<header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-(--color-stage-border) px-4 py-3 sm:px-7">
			<div className="flex min-w-0 items-center gap-3">
				<span
					aria-hidden="true"
					className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-stage-surface) max-sm:hidden"
				>
					<Video className="size-5" />
				</span>
				<div className="min-w-0">
					<p className="text-xs uppercase tracking-wide text-(--color-stage-text-muted) max-sm:hidden">Video visit</p>
					<h1 className="truncate text-base font-semibold text-(--color-stage-text) sm:text-lg">{title}</h1>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
				{showLive && (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/50 px-2.5 py-1 text-xs font-medium text-green-300">
						<span aria-hidden="true" className="size-1.5 rounded-full bg-green-400" />
						{statusLabel}
					</span>
				)}
				<span role="timer" aria-label="Elapsed visit time" className="text-sm tabular-nums text-(--color-stage-text)">
					{elapsed}
				</span>
				<NetworkIndicator level={networkLevel} />
				<span className="rounded-md bg-(--color-stage-surface-raised) px-2 py-1 text-xs text-(--color-stage-text)">
					Demo · synthetic data
				</span>
			</div>
		</header>
	);
}

export function EncryptionNote({className}: {className?: string}) {
	return (
		<p className={cn('flex items-center gap-1.5 text-xs text-(--color-stage-text-muted)', className)}>
			<Lock aria-hidden="true" className="size-3.5" />
			{STAGE_ENCRYPTION_NOTE}
		</p>
	);
}
