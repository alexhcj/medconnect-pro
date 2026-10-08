'use client';

import {cn} from '@/lib/utils/utils';
import type {DailyMediaConnectionState} from '@/lib/hooks/use-daily-media-session';

export const MEDIA_CONNECTION_COPY = {
	joining: 'Connecting media…',
	waiting_for_participant: 'Waiting for the other participant',
	connected: 'Connected',
	reconnecting: 'Reconnecting…',
	not_configured: 'Live media is not configured in this environment',
	failed: 'Live media is currently unavailable.',
	mock: 'Demo placeholder',
} as const;

export function MediaConnectionStatus({
	state,
}: {
	state: DailyMediaConnectionState | 'mock';
}) {
	const isFailed = state === 'failed';

	return (
		<div
			className={cn(
				'flex items-center gap-2 rounded-lg px-3 py-2',
				isFailed ? 'border border-red-200 bg-white' : 'bg-brand-subtle',
			)}
			aria-live="polite"
			role="status"
		>
			<span
				className={cn('inline-block size-2 rounded-full', isFailed ? 'bg-destructive' : 'bg-brand')}
				aria-hidden
			/>
			<p className={cn('text-sm font-medium', isFailed ? 'text-foreground' : 'text-brand')}>
				{MEDIA_CONNECTION_COPY[state]}
			</p>
		</div>
	);
}
