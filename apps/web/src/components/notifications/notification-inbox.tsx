'use client';

import {Button} from '@/components/ui/button';
import {NotificationItem} from '@/components/notifications/notification-item';
import type {InboxNotification} from '@/types/notifications/inbox';

interface NotificationInboxProps {
	notifications: InboxNotification[] | undefined;
	isPending: boolean;
	isError: boolean;
	onRetry: () => void;
	onMarkRead: (id: string) => void;
	isMarking: boolean;
}

export function NotificationInbox({
	notifications,
	isPending,
	isError,
	onRetry,
	onMarkRead,
	isMarking,
}: NotificationInboxProps) {
	if (isPending) {
		return (
			<div className="space-y-3 p-4" aria-busy="true" aria-label="Loading notifications">
				<p className="text-xs text-foreground-muted">Loading notifications</p>
				<div className="h-14 animate-pulse rounded-md bg-subtle" />
				<div className="h-14 animate-pulse rounded-md bg-subtle" />
				<div className="h-14 animate-pulse rounded-md bg-subtle" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="p-4">
				<div className="rounded-md border border-danger bg-surface p-3" role="alert">
					<p className="text-sm text-foreground">Unable to load notifications.</p>
					<Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	if (!notifications || notifications.length === 0) {
		return (
			<div className="px-4 py-8">
				<p className="text-sm text-foreground">No notifications.</p>
				<p className="mt-2 text-xs text-foreground-muted">
					Channel preferences remain available.
				</p>
			</div>
		);
	}

	return (
		<ul className="flex max-h-[420px] flex-col gap-1 overflow-y-auto p-2" aria-label="Notifications">
			{notifications.map((notification) => (
				<NotificationItem
					key={notification.id}
					notification={notification}
					onMarkRead={onMarkRead}
					isMarking={isMarking}
				/>
			))}
		</ul>
	);
}
